const express = require("express");
const authController = require("../Controllers/authController");
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} = require("../Validators/authValidator");
const { protect, registrationOpen } = require("../Middleware/authMiddleware");
const { loginLimiter, registerLimiter, passwordLimiter } = require("../Middleware/rateLimiter");

const router = express.Router();

// Public
router.post("/register", registrationOpen, registerLimiter, validateRegister, authController.register);
router.post("/login", loginLimiter, validateLogin, authController.login);

// Any logged-in user, for their own account
router
  .route("/me")
  .get(protect, authController.getMe)
  .patch(protect, validateUpdateProfile, authController.updateMe);
router.patch(
  "/password",
  protect,
  passwordLimiter,
  validateChangePassword,
  authController.changePassword
);
router.post("/logout", protect, authController.logout);

module.exports = router;
