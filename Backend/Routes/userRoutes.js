const express = require("express");

const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  createUser,
  getUsers,
  getUser,
  updateUser,
  activateUser,
  deactivateUser,
} = require("../Controllers/userController.js");

const protect = require("../Middleware/authMiddleware.js");
const authorize = require("../Middleware/roleMiddleware.js");
const validate = require("../Middleware/validate.js");

const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  profileValidator,
  changePasswordValidator,
  createUserValidator,
  updateUserValidator,
  userIdValidator,
} = require("../Validators/userValidator.js");

const router = express.Router();


// ======================================================
// AUTHENTICATION
// ======================================================

router.post(
  "/register",
  registerValidator,
  validate,
  register
);

router.post(
  "/login",
  loginValidator,
  validate,
  login
);

router.post(
  "/logout",
  protect,
  logout
);

router.get(
  "/me",
  protect,
  getMe
);

// ======================================================
// PASSWORD RESET
// ======================================================

router.post(
  "/forgot-password",
  forgotPasswordValidator,
  validate,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPasswordValidator,
  validate,
  resetPassword
);

// ======================================================
// PROFILE
// ======================================================

router.patch(
  "/profile",
  protect,
  profileValidator,
  validate,
  updateProfile
);

router.patch(
  "/change-password",
  protect,
  changePasswordValidator,
  validate,
  changePassword
);


// ======================================================
// ADMIN USER MANAGEMENT
// ======================================================

router.post(
  "/",
  protect,
  authorize("admin"),
  createUserValidator,
  validate,
  createUser
);

router.get(
  "/",
  protect,
  authorize("admin"),
  getUsers
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  userIdValidator,
  validate,
  getUser
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateUserValidator,
  validate,
  updateUser
);

router.patch(
  "/:id/activate",
  protect,
  authorize("admin"),
  userIdValidator,
  validate,
  activateUser
);

router.patch(
  "/:id/deactivate",
  protect,
  authorize("admin"),
  userIdValidator,
  validate,
  deactivateUser
);

module.exports = router;