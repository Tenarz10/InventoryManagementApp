const express = require("express");
const controller = require("../Controllers/productController");
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateStockAdjustment,
} = require("../Validators/productValidator");

const router = express.Router();



router.get("/", controller.getProducts);
router.post("/", validateCreateProduct, controller.createProduct);


router.get("/low-stock", controller.getLowStockProducts);

router.get("/:id", controller.getProductById);
router.put("/:id", validateUpdateProduct, controller.updateProduct);
router.delete("/:id", controller.deleteProduct);

router.patch("/:id/stock", validateStockAdjustment, controller.adjustStock);

module.exports = router;
