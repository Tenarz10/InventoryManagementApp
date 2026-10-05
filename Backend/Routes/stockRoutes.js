const express = require("express");
const stockController = require("../Controllers/stockController");
const {
  validateProductIdParam,
  validateCreateStock,
  validateUpdateStock,
  validateStockMovement,
  validateStockAdjustment,
  validateStockQuery,
  validateMovementQuery
} = require("../Validators/stockValidator");
const protect = require("../Middleware/authMiddleware");

const router = express.Router();

// Reads are public; every endpoint that changes stock requires a logged-in user

// Fixed paths must come before /:productId
router.get("/summary", stockController.getStockSummary);
router.get("/low-stock", stockController.getLowStock);
router.get("/movements", validateMovementQuery, stockController.getAllMovements);

router
  .route("/")
  .get(validateStockQuery, stockController.getAllStock)
  .post(protect, validateCreateStock, stockController.createStock);

router
  .route("/:productId")
  .all(validateProductIdParam)
  .get(stockController.getStockByProduct)
  .patch(protect, validateUpdateStock, stockController.updateStock)
  .delete(protect, stockController.deleteStock);

router.get(
  "/:productId/movements",
  validateProductIdParam,
  validateMovementQuery,
  stockController.getProductMovements
);
router.post(
  "/:productId/in",
  protect,
  validateProductIdParam,
  validateStockMovement,
  stockController.stockIn
);
router.post(
  "/:productId/out",
  protect,
  validateProductIdParam,
  validateStockMovement,
  stockController.stockOut
);
router.post(
  "/:productId/adjust",
  protect,
  validateProductIdParam,
  validateStockAdjustment,
  stockController.adjustStock
);

module.exports = router;
