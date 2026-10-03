const Product = require("../Models/Product");
const StockMovement = require("../Models/StockMovement");
const Supplier = require("../Models/Supplier")

exports.getDashboardSummary = async(req, res) => {
    try{
        const totalProducts = await Product.countDocuments();
        const totalSuppliers = await Supplier.countDocuments();
        const totalMovements = await StockMovement.countDocuments();

        res.json({
            success: true,
            message: "Dashboard summary fetched successfully",
            data: {totalProducts, totalSuppliers, totalMovements}
        });
    }catch (error) {
        res.status(500).json({success: false, message: "Something went wrong", data: null});
    }
};

exports.getLowStockProducts = async(req, res) => {
    try{
        const products = await Product.find({
            $expr: {$lte: ["$quantity", "$reorderLevel"]}
        });
        res.json({
            success: true,
            message: "Low stock products fetched successfully",
            data: products
        });
    }catch (error) {
        res.status(500).json({success: false, message: "Error fetching low stock products", data: null});
    }
};

exports.getOutOfStockProducts = async(req, res) => {
    try{
        const products = await Product.find({quantity: 0})
        res.json({
            success: true,
            message: "Out of stock products fetched successfully",
            data: products
        });
    }catch (error) {
        res.status(500).json({success: false, message: "Error fetching out of stock products", data: null})
    }
};

exports.getRecentMovements = async(req, res) => {
    try{
        const movements = await StockMovement.find()
        .sort({ date: -1 })
        .limit(10);
        res.json({
            success: true,
            message: "Recent stock movements fetched successfully",
            data: movements
        })
    }catch (error) {
        res.status(500).json({success: false, message: "Error fetching recent stock movements", data: null})
    }
};