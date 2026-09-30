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

const router = express.Router();

// Fixed paths must come before /:productId
router.get("/summary", stockController.getStockSummary);
router.get("/low-stock", stockController.getLowStock);
router.get("/movements", validateMovementQuery, stockController.getAllMovements);

router
  .route("/")
  .get(validateStockQuery, stockController.getAllStock)
  .post(validateCreateStock, stockController.createStock);

router
  .route("/:productId")
  .all(validateProductIdParam)
  .get(stockController.getStockByProduct)
  .patch(validateUpdateStock, stockController.updateStock)
  .delete(stockController.deleteStock);

router.get(
  "/:productId/movements",
  validateProductIdParam,
  validateMovementQuery,
  stockController.getProductMovements
);
router.post(
  "/:productId/in",
  validateProductIdParam,
  validateStockMovement,
  stockController.stockIn
);
router.post(
  "/:productId/out",
  validateProductIdParam,
  validateStockMovement,
  stockController.stockOut
);
router.post(
  "/:productId/adjust",
  validateProductIdParam,
  validateStockAdjustment,
  stockController.adjustStock
);

module.exports = router;
