const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const connectDB = require("./Config/db.js");
const userRoutes = require("./Routes/userRoutes.js");
const errorHandler = require("./Middleware/errorHandler.js");


const app = express();


// ==========================================
// DATABASE
// ==========================================

connectDB();


// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Inventory Management API is running",
    data: null,
  });
});


// ==========================================
// USER ROUTES
// ==========================================

app.use(
  "/api/users",
  userRoutes
);


// ==========================================
// ERROR HANDLER
// ==========================================

app.use(errorHandler);


// ==========================================
// SERVER
// ==========================================

const PORT =
  process.env.PORT;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});