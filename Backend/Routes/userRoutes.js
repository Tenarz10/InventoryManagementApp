const express = require("express");
const userController = require("../Controllers/userController");
const {
  validateUserIdParam,
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
  validateUserQuery
} = require("../Validators/userValidator");
const { protect, authorize } = require("../Middleware/authMiddleware");
const { PERMISSIONS } = require("../Utils/authConstants");

const router = express.Router();

// Managers can view accounts; only admins can change them
const canRead = authorize(...PERMISSIONS.USERS_READ);
const canManage = authorize(...PERMISSIONS.USERS_MANAGE);

router.use(protect);

router
  .route("/")
  .get(canRead, validateUserQuery, userController.getAllUsers)
  .post(canManage, validateCreateUser, userController.createUser);

router
  .route("/:userId")
  .get(canRead, validateUserIdParam, userController.getUser)
  .patch(canManage, validateUserIdParam, validateUpdateUser, userController.updateUser)
  .delete(canManage, validateUserIdParam, userController.deleteUser);

router.patch(
  "/:userId/password",
  canManage,
  validateUserIdParam,
  validateResetPassword,
  userController.resetPassword
);

module.exports = router;
