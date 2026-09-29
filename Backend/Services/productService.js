// All database logic for products lives here. Controllers just call these functions.
const mongoose = require("mongoose");
const Product = require("../Models/Product");
const AppError = require("../Utils/AppError");

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Invalid product id", 400);
};

// Stops users from breaking the search with regex symbols like ( or *
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createProduct = async (data) => Product.create(data);

const getProducts = async ({ page = 1, limit = 10, search, category, lowStock, sort } = {}) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const filter = {};

  if (typeof search === "string" && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: regex }, { sku: regex }, { category: regex }];
  }
  if (typeof category === "string" && category.trim()) {
    filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
  }
  if (lowStock === "true") {
    filter.$expr = { $lte: ["$quantity", "$reorderLevel"] };
  }

  // ?sort=price or ?sort=-price (minus = descending). Only these fields are allowed.
  const sortable = ["name", "price", "quantity", "createdAt"];
  let sortBy = { createdAt: -1 };
  if (typeof sort === "string") {
    const field = sort.replace(/^-/, "");
    if (sortable.includes(field)) sortBy = { [field]: sort.startsWith("-") ? -1 : 1 };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortBy)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

const getProductById = async (id) => {
  assertValidId(id);
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  return product;
};

const updateProduct = async (id, data) => {
  assertValidId(id);
  const product = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new AppError("Product not found", 404);
  return product;
};

const deleteProduct = async (id) => {
  assertValidId(id);
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError("Product not found", 404);
  return product;
};

// Add or remove stock in ONE atomic step, so two requests at the same time can't
// push the quantity below zero. The stock movements teammate can call this too.
const adjustStock = async (id, change) => {
  assertValidId(id);

  const filter = { _id: id };
  if (change < 0) filter.quantity = { $gte: Math.abs(change) };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: id });
    if (!exists) throw new AppError("Product not found", 404);
    throw new AppError("Insufficient stock for this adjustment", 400);
  }
  return product;
};

const getLowStockProducts = async () =>
  Product.find({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }).sort({ quantity: 1 });

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStockProducts,
};
