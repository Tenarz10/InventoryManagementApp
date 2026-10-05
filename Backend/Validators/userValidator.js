const mongoose = require("mongoose");
const {
  isPresent,
  checkName,
  checkEmail,
  checkNewPassword,
  rejectFields,
  validate
} = require("./authValidator");
const { ALL_ROLES } = require("../Utils/authConstants");

const checkRole = (source, errors) => {
  if (isPresent(source.role) && !ALL_ROLES.includes(source.role)) {
    errors.push(`role must be one of: ${ALL_ROLES.join(", ")}`);
  }
};

// Form data and query strings send booleans as "true"/"false"
const checkBoolean = (source, field, errors) => {
  if (!isPresent(source[field])) return;

  if (source[field] === "true") source[field] = true;
  if (source[field] === "false") source[field] = false;

  if (typeof source[field] !== "boolean") {
    errors.push(`${field} must be true or false`);
  }
};

const validateUserIdParam = validate(({ params }, errors) => {
  if (!mongoose.isValidObjectId(params.userId)) {
    errors.push("userId must be a valid id");
  }
});

const validateCreateUser = validate(({ body }, errors) => {
  checkName(body, errors, { required: true });
  checkEmail(body, errors);
  checkNewPassword(body, errors);
  checkRole(body, errors);
});

const validateUpdateUser = validate(({ body }, errors) => {
  rejectFields(body, ["password"], errors, "use PATCH /api/users/:userId/password");

  if (!["name", "email", "role", "isActive"].some((field) => isPresent(body[field]))) {
    errors.push("Provide name, email, role or isActive to update");
  }

  checkName(body, errors);
  checkEmail(body, errors, { required: false });
  checkRole(body, errors);
  checkBoolean(body, "isActive", errors);
});

const validateResetPassword = validate(({ body }, errors) => {
  checkNewPassword(body, errors, "newPassword");
});

const validateUserQuery = validate(({ query }, errors) => {
  checkRole(query, errors);
  checkBoolean(query, "isActive", errors);
});

module.exports = {
  validateUserIdParam,
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
  validateUserQuery
};
