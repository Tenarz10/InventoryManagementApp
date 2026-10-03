const express = require("express");
const authController = require("../Controllers/authController");
const { validateRegister, validateLogin } = require("../Validators/authValidator");
const { protect } = require("../Middleware/authMiddleware");

const router = express.Router();

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/me", protect, authController.getMe);

module.exports = router;
