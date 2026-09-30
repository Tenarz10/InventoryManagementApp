const mongoose = require("mongoose");
const Stock = require("../Models/Stock");
const StockMovement = require("../Models/StockMovement");
const AppError = require("../Utils/AppError");
const { MOVEMENT_TYPES, STOCK_STATUS } = require("../Utils/stockConstants");

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// The Product model belongs to another module, so only populate once it is registered
const withProduct = (query) =>
  mongoose.models.Product ? query.populate("product") : query;

const getPagination = ({ page, limit } = {}) => {
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );

  return { page: pageNumber, limit: pageSize, skip: (pageNumber - 1) * pageSize };
};

const buildPaginationMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit)
});

// MongoDB filters matching the status virtual on the Stock model
const hasMaxLevel = { $gt: ["$maxLevel", 0] };

const statusFilters = {
  [STOCK_STATUS.OUT_OF_STOCK]: { quantity: 0 },
  [STOCK_STATUS.LOW_STOCK]: {
    quantity: { $gt: 0 },
    $expr: { $lte: ["$quantity", "$reorderLevel"] }
  },
  [STOCK_STATUS.OVERSTOCKED]: {
    $expr: {
      $and: [
        { $gt: ["$quantity", "$reorderLevel"] },
        hasMaxLevel,
        { $gt: ["$quantity", "$maxLevel"] }
      ]
    }
  },
  [STOCK_STATUS.IN_STOCK]: {
    $expr: {
      $and: [
        { $gt: ["$quantity", "$reorderLevel"] },
        { $or: [{ $not: [hasMaxLevel] }, { $lte: ["$quantity", "$maxLevel"] }] }
      ]
    }
  }
};

const needsReorderFilter = { $expr: { $lte: ["$quantity", "$reorderLevel"] } };

const notFound = () => new AppError("Stock record not found for this product", 404);

const findStockOrFail = async (productId) => {
  const stock = await withProduct(Stock.findOne({ product: productId }));

  if (!stock) {
    throw notFound();
  }

  return stock;
};

const recordMovement = (movement) =>
  StockMovement.create({
    product: movement.product,
    type: movement.type,
    quantity: movement.quantity,
    previousQuantity: movement.previousQuantity,
    newQuantity: movement.newQuantity,
    reason: movement.reason,
    reference: movement.reference,
    note: movement.note,
    performedBy: movement.performedBy
  });

const listStock = async (query = {}) => {
  const filter = {};

  if (query.status) {
    Object.assign(filter, statusFilters[query.status]);
  }

  if (query.location) {
    filter.location = query.location;
  }

  const pagination = getPagination(query);

  const [items, total] = await Promise.all([
    withProduct(
      Stock.find(filter)
        .sort({ updatedAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
    ),
    Stock.countDocuments(filter)
  ]);

  return { items, pagination: buildPaginationMeta(pagination, total) };
};

// Everything at or below its reorder level, including out of stock
const getLowStock = () =>
  withProduct(Stock.find(needsReorderFilter).sort({ quantity: 1 }));

const getStockSummary = async () => {
  const [summary] = await Stock.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalUnits: { $sum: "$quantity" },
        outOfStock: { $sum: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] } },
        lowStock: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$quantity", 0] },
                  { $lte: ["$quantity", "$reorderLevel"] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $project: { _id: 0 } }
  ]);

  return summary || { totalProducts: 0, totalUnits: 0, outOfStock: 0, lowStock: 0 };
};

const getStockByProduct = (productId) => findStockOrFail(productId);

const createStock = async (data, performedBy) => {
  const existing = await Stock.exists({ product: data.product });

  if (existing) {
    throw new AppError("Stock record already exists for this product", 409);
  }

  const stock = await Stock.create({
    product: data.product,
    quantity: data.quantity,
    reorderLevel: data.reorderLevel,
    maxLevel: data.maxLevel,
    location: data.location,
    lastRestockedAt: data.quantity > 0 ? new Date() : undefined
  });

  if (stock.quantity > 0) {
    await recordMovement({
      product: stock.product,
      type: MOVEMENT_TYPES.INITIAL,
      quantity: stock.quantity,
      previousQuantity: 0,
      newQuantity: stock.quantity,
      reason: "Initial stock",
      performedBy
    });
  }

  return stock;
};

// Settings only; quantity changes go through stockIn, stockOut or adjustStock
const updateStockSettings = async (productId, updates) => {
  const stock = await findStockOrFail(productId);

  ["reorderLevel", "maxLevel", "location"].forEach((field) => {
    if (updates[field] !== undefined) {
      stock[field] = updates[field];
    }
  });

  await stock.save();

  return stock;
};

const stockIn = async (productId, { quantity, reason, reference, note }, performedBy) => {
  const stock = await withProduct(
    Stock.findOneAndUpdate(
      { product: productId },
      { $inc: { quantity }, $set: { lastRestockedAt: new Date() } },
      { returnDocument: "after" }
    )
  );

  if (!stock) {
    throw notFound();
  }

  const movement = await recordMovement({
    product: productId,
    type: MOVEMENT_TYPES.IN,
    quantity,
    previousQuantity: stock.quantity - quantity,
    newQuantity: stock.quantity,
    reason,
    reference,
    note,
    performedBy
  });

  return { stock, movement };
};

const stockOut = async (productId, { quantity, reason, reference, note }, performedBy) => {
  // Only matches when there is enough stock, so quantity can never go negative
  const stock = await withProduct(
    Stock.findOneAndUpdate(
      { product: productId, quantity: { $gte: quantity } },
      { $inc: { quantity: -quantity } },
      { returnDocument: "after" }
    )
  );

  if (!stock) {
    const current = await Stock.findOne({ product: productId }).select("quantity");

    if (!current) {
      throw notFound();
    }

    throw new AppError(
      `Insufficient stock: requested ${quantity}, available ${current.quantity}`,
      400
    );
  }

  const movement = await recordMovement({
    product: productId,
    type: MOVEMENT_TYPES.OUT,
    quantity,
    previousQuantity: stock.quantity + quantity,
    newQuantity: stock.quantity,
    reason,
    reference,
    note,
    performedBy
  });

  return { stock, movement };
};

// Sets the quantity to an exact count, e.g. after a physical stock take
const adjustStock = async (productId, { quantity, reason, reference, note }, performedBy) => {
  const previous = await Stock.findOneAndUpdate(
    { product: productId },
    { $set: { quantity } },
    { returnDocument: "before" }
  );

  if (!previous) {
    throw notFound();
  }

  const movement = await recordMovement({
    product: productId,
    type: MOVEMENT_TYPES.ADJUSTMENT,
    quantity: Math.abs(quantity - previous.quantity),
    previousQuantity: previous.quantity,
    newQuantity: quantity,
    reason,
    reference,
    note,
    performedBy
  });

  const stock = await findStockOrFail(productId);

  return { stock, movement };
};

// Movement history is kept for auditing even after the stock record is removed
const deleteStock = async (productId) => {
  const stock = await Stock.findOneAndDelete({ product: productId });

  if (!stock) {
    throw notFound();
  }

  return stock;
};

const getMovements = async (query = {}, productId) => {
  const filter = {};
  const product = productId || query.product;

  if (product) {
    filter.product = product;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const pagination = getPagination(query);

  const [items, total] = await Promise.all([
    withProduct(
      StockMovement.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
    ),
    StockMovement.countDocuments(filter)
  ]);

  return { items, pagination: buildPaginationMeta(pagination, total) };
};

module.exports = {
  getPagination,
  listStock,
  getLowStock,
  getStockSummary,
  getStockByProduct,
  createStock,
  updateStockSettings,
  stockIn,
  stockOut,
  adjustStock,
  deleteStock,
  getMovements
};
