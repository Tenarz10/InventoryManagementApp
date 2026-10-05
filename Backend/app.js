const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const productRoutes = require("./Routes/productRoutes");
const errorHandler = require("./Middleware/errorHandler");

const app = express();

// Security middleware
app.use(helmet());

// Allow requests from frontend
app.use(cors());

// Parse incoming JSON
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Base API route
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Inventory Management API is running"
  });
});

// API status route
app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully"
  });
});

// Feature routes
app.use("/api/products", productRoutes);
// app.use("/api/suppliers", supplierRoutes);
// app.use("/api/stock-movements", stockMovementRoutes);
// app.use("/api/auth", authRoutes);

// Handle routes that do not exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Central error handler (must be last)
app.use(errorHandler);

module.exports = app;