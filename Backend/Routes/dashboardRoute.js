const express = require("express");
const router = express.Router();
const dashboardController = require("../Controllers/dashboardController");

router.get("/summary", dashboardController.getDashboardSummary);
router.get("/low-stock", dashboardController.getLowStockProducts);
router.get("/out-of-stock", dashboardController.getOutOfStockProducts);
router.get("/recent-movements", dashboardController.getRecentMovements);

module.exports = router;
