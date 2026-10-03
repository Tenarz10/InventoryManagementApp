const stockService = require("../Services/stockService");

// req.user is set by the protect middleware on routes that change stock
const currentUserId = (req) => req.user?._id;

const getAllStock = async (req, res) => {
  const { items, pagination } = await stockService.listStock(req.query);

  res.status(200).json({ success: true, count: items.length, pagination, data: items });
};

const getLowStock = async (req, res) => {
  const items = await stockService.getLowStock();

  res.status(200).json({ success: true, count: items.length, data: items });
};

const getStockSummary = async (req, res) => {
  const summary = await stockService.getStockSummary();

  res.status(200).json({ success: true, data: summary });
};

const getStockByProduct = async (req, res) => {
  const stock = await stockService.getStockByProduct(req.params.productId);

  res.status(200).json({ success: true, data: stock });
};

const createStock = async (req, res) => {
  const stock = await stockService.createStock(req.body, currentUserId(req));

  res.status(201).json({
    success: true,
    message: "Stock record created successfully",
    data: stock
  });
};

const updateStock = async (req, res) => {
  const stock = await stockService.updateStockSettings(req.params.productId, req.body);

  res.status(200).json({
    success: true,
    message: "Stock settings updated successfully",
    data: stock
  });
};

const stockIn = async (req, res) => {
  const result = await stockService.stockIn(
    req.params.productId,
    req.body,
    currentUserId(req)
  );

  res.status(200).json({
    success: true,
    message: `Added ${req.body.quantity} unit(s) to stock`,
    data: result
  });
};

const stockOut = async (req, res) => {
  const result = await stockService.stockOut(
    req.params.productId,
    req.body,
    currentUserId(req)
  );

  res.status(200).json({
    success: true,
    message: `Removed ${req.body.quantity} unit(s) from stock`,
    data: result
  });
};

const adjustStock = async (req, res) => {
  const result = await stockService.adjustStock(
    req.params.productId,
    req.body,
    currentUserId(req)
  );

  res.status(200).json({
    success: true,
    message: "Stock adjusted successfully",
    data: result
  });
};

const deleteStock = async (req, res) => {
  await stockService.deleteStock(req.params.productId);

  res.status(200).json({ success: true, message: "Stock record deleted successfully" });
};

const getAllMovements = async (req, res) => {
  const { items, pagination } = await stockService.getMovements(req.query);

  res.status(200).json({ success: true, count: items.length, pagination, data: items });
};

const getProductMovements = async (req, res) => {
  const { items, pagination } = await stockService.getMovements(
    req.query,
    req.params.productId
  );

  res.status(200).json({ success: true, count: items.length, pagination, data: items });
};

module.exports = {
  getAllStock,
  getLowStock,
  getStockSummary,
  getStockByProduct,
  createStock,
  updateStock,
  stockIn,
  stockOut,
  adjustStock,
  deleteStock,
  getAllMovements,
  getProductMovements
};
