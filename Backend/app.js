const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./Routes/authRoutes");
const stockRoutes = require("./Routes/stockRoutes");
const userRoutes = require("./Routes/userRoutes");
const errorHandler = require("./Middleware/errorHandler");

const app = express();

// Behind a reverse proxy, trust its X-Forwarded-For so rate limiting sees the real client IP.
// TRUST_PROXY is the number of proxies in front of the app.
const proxyHops = Number(process.env.TRUST_PROXY);
if (proxyHops > 0) {
  app.set("trust proxy", proxyHops);
}

// Security middleware
app.use(helmet());

// Allow requests from the frontend; CORS_ORIGIN is a comma-separated list of allowed origins.
// Without it every origin is allowed, which is only meant for local development.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : "*";
app.use(cors({ origin: allowedOrigins }));

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

// Registration, login and the logged-in user's own account
app.use("/api/auth", authRoutes);

// User management (managers can view, admins can change)
app.use("/api/users", userRoutes);

// Stock levels and stock movements (in, out, adjustments)
app.use("/api/stock", stockRoutes);

// Future routes will go here
// app.use("/api/products", productRoutes);
// app.use("/api/suppliers", supplierRoutes);

// Handle routes that do not exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Handle errors thrown by routes
app.use(errorHandler);

module.exports = app;