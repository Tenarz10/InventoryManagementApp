const express = require("express");
const controller = require("../Controllers/productController");
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateStockAdjustment,
} = require("../Validators/productValidator");

const router = express.Router();

// TODO: once the auth middleware exists, protect the write routes, e.g.
// router.post("/", protect, validateCreateProduct, controller.createProduct);

router.get("/", controller.getProducts);
router.post("/", validateCreateProduct, controller.createProduct);

// Must come BEFORE "/:id", otherwise "low-stock" would be treated as an id
router.get("/low-stock", controller.getLowStockProducts);

router.get("/:id", controller.getProductById);
router.put("/:id", validateUpdateProduct, controller.updateProduct);
router.delete("/:id", controller.deleteProduct);

router.patch("/:id/stock", validateStockAdjustment, controller.adjustStock);

module.exports = router;
