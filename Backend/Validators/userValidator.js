const { body, param } = require("express-validator");

// ==========================================
// REGISTER
// ==========================================

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// ==========================================
// LOGIN
// ==========================================

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

// ==========================================
// UPDATE PROFILE
// ==========================================

const profileValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

// ==========================================
// CHANGE PASSWORD
// ==========================================

const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

// ==========================================
// ADMIN CREATE USER
// ==========================================

const createUserValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["admin", "business_owner", "store_keeper"])
    .withMessage("Invalid user role"),
];

// ==========================================
// ADMIN UPDATE USER
// ==========================================

const updateUserValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("role")
    .optional()
    .isIn(["admin", "business_owner", "store_keeper"])
    .withMessage("Invalid user role"),
];

// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

// ==========================================
// RESET PASSWORD
// ==========================================

const resetPasswordValidator = [
  param("token")
    .notEmpty()
    .withMessage("Reset token is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

// ==========================================
// USER ID
// ==========================================

const userIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID"),
];

// Exporting using CommonJS
module.exports = {
  registerValidator,
  loginValidator,
  profileValidator,
  changePasswordValidator,
  createUserValidator,
  updateUserValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  userIdValidator,
};