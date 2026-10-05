const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Import Route Handlers from Team Features
const userRoutes = require("./Routes/userRoutes");             // Your Feature
const productRoutes = require("./Routes/productRoutes");       // Team Feature
const supplierRoutes = require("./Routes/SupplierRoutes");     // Team Feature
const stockRoutes = require("./Routes/stockRoutes"); // Team Feature
const dashboardRoutes = require("./Routes/dashboardRoute"); // Team Feature

// Custom Error Handler
const errorHandler = require("./Middleware/errorHandler");

const app = express();

// ==========================================
// SECURITY & GLOBAL MIDDLEWARE
// ==========================================

// Security HTTP headers
app.use(helmet());

// CORS configuration (restricts access to frontend URL in production)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// HEALTH & BASE ROUTES
// ==========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Inventory Management API is running",
    data: null,
  });
});

// ==========================================
// API FEATURE ROUTES
// ==========================================

app.use("/api/users", userRoutes);             // User feature (Auth / Management)
app.use("/api/dashboard", dashboardRoutes);     // Dashboard analytics
app.use("/api/products", productRoutes);       // Products management
app.use("/api/suppliers", supplierRoutes);     // Suppliers management
app.use("/api/stock", stockRoutes);    // Stock movements & inventory logs

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

// Handle 404 - Route Not Found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// Global Error Handler (Catches all thrown errors from async routes)
app.use(errorHandler);

module.exports = app;