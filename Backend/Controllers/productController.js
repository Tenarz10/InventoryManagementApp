
const productService = require("../Services/productService");

const createProduct = async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ success: true, message: "Product created successfully", data: product });
};

const getProducts = async (req, res) => {
  const { products, pagination } = await productService.getProducts(req.query);
  res.status(200).json({ success: true, count: products.length, pagination, data: products });
};

const getLowStockProducts = async (req, res) => {
  const products = await productService.getLowStockProducts();
  res.status(200).json({ success: true, count: products.length, data: products });
};

const getProductById = async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json({ success: true, data: product });
};

const updateProduct = async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Product updated successfully", data: product });
};

const deleteProduct = async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(200).json({ success: true, message: "Product deleted successfully" });
};

const adjustStock = async (req, res) => {
  const product = await productService.adjustStock(req.params.id, req.body.change);
  res.status(200).json({ success: true, message: "Stock updated successfully", data: product });
};

module.exports = {
  createProduct,
  getProducts,
  getLowStockProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
};
