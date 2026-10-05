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
const { protect, authorize } = require("../Middleware/authMiddleware");
const { PERMISSIONS } = require("../Utils/authConstants");

const router = express.Router();

// Every role can view stock and record stock in/out; managers and admins
// manage stock records and adjust quantities; only admins delete records
const canRead = authorize(...PERMISSIONS.STOCK_READ);
const canMove = authorize(...PERMISSIONS.STOCK_MOVE);
const canManage = authorize(...PERMISSIONS.STOCK_MANAGE);
const canDelete = authorize(...PERMISSIONS.STOCK_DELETE);

router.use(protect);

// Fixed paths must come before /:productId
router.get("/summary", canRead, stockController.getStockSummary);
router.get("/low-stock", canRead, stockController.getLowStock);
router.get("/movements", canRead, validateMovementQuery, stockController.getAllMovements);

router
  .route("/")
  .get(canRead, validateStockQuery, stockController.getAllStock)
  .post(canManage, validateCreateStock, stockController.createStock);

router
  .route("/:productId")
  .get(canRead, validateProductIdParam, stockController.getStockByProduct)
  .patch(canManage, validateProductIdParam, validateUpdateStock, stockController.updateStock)
  .delete(canDelete, validateProductIdParam, stockController.deleteStock);

router.get(
  "/:productId/movements",
  canRead,
  validateProductIdParam,
  validateMovementQuery,
  stockController.getProductMovements
);
router.post(
  "/:productId/in",
  canMove,
  validateProductIdParam,
  validateStockMovement,
  stockController.stockIn
);
router.post(
  "/:productId/out",
  canMove,
  validateProductIdParam,
  validateStockMovement,
  stockController.stockOut
);
router.post(
  "/:productId/adjust",
  canManage,
  validateProductIdParam,
  validateStockAdjustment,
  stockController.adjustStock
);

module.exports = router;
