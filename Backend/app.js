const express = require("express");
const supplierRoutes = require("./Routes/SupplierRoutes");

const app = express();

app.use(express.json());

app.use("/api/suppliers", supplierRoutes);

app.get("/", (req,res)  => {
    res.status(200).json({
        success: true,
        message: "Inventory Management API is running",
    });
});

module.exports = app;