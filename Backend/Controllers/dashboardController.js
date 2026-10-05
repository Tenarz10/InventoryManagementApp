const Product = require("../Models/Product");
const Supplier = require("../Models/Supplier");
const Stock = require("../Models/Stock");
const StockMovement = require("../Models/StockMovement");

// ==========================================
// DASHBOARD SUMMARY
// ==========================================

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();
    const totalMovements = await StockMovement.countDocuments();

    const lowStock = await Stock.countDocuments({
      quantity: { $gt: 0 },
      $expr: {
        $lte: ["$quantity", "$reorderLevel"],
      },
    });

    const outOfStock = await Stock.countDocuments({
      quantity: 0,
    });

    res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data: {
        totalProducts,
        totalSuppliers,
        totalMovements,
        lowStock,
        outOfStock,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      data: null,
    });
  }
};

// ==========================================
// LOW STOCK PRODUCTS
// ==========================================

exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Stock.find({
      quantity: { $gt: 0 },
      $expr: {
        $lte: ["$quantity", "$reorderLevel"],
      },
    }).populate("product");

    res.status(200).json({
      success: true,
      message: "Low stock products fetched successfully",
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching low stock products",
      data: null,
    });
  }
};

// ==========================================
// OUT OF STOCK PRODUCTS
// ==========================================

exports.getOutOfStockProducts = async (req, res) => {
  try {
    const products = await Stock.find({
      quantity: 0,
    }).populate("product");

    res.status(200).json({
      success: true,
      message: "Out of stock products fetched successfully",
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching out of stock products",
      data: null,
    });
  }
};

// ==========================================
// RECENT STOCK MOVEMENTS
// ==========================================

exports.getRecentMovements = async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .populate("product")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: "Recent stock movements fetched successfully",
      data: movements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recent stock movements",
      data: null,
    });
  }
};