const AppError = require("../Utils/AppError");
const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require("../Utils/authConstants");

const MAX_NAME_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPresent = (value) => value !== undefined && value !== null && value !== "";

const checkName = (body, errors, { required = false } = {}) => {
  if (!isPresent(body.name)) {
    if (required) errors.push("name is required");
  } else if (
    typeof body.name !== "string" ||
    body.name.trim() === "" ||
    body.name.trim().length > MAX_NAME_LENGTH
  ) {
    errors.push(`name must be text of at most ${MAX_NAME_LENGTH} characters`);
  }
};

const checkEmail = (body, errors, { required = true } = {}) => {
  if (!isPresent(body.email)) {
    if (required) errors.push("email is required");
  } else if (typeof body.email !== "string" || !EMAIL_PATTERN.test(body.email.trim())) {
    errors.push("email must be a valid email address");
  } else {
    body.email = body.email.trim();
  }
};

// Any password being checked against a stored hash (login, current password)
const checkPasswordPresent = (body, errors, field = "password") => {
  if (!isPresent(body[field])) {
    errors.push(`${field} is required`);
  } else if (typeof body[field] !== "string") {
    errors.push(`${field} must be text`);
  }
};

// A password that is about to be stored
const checkNewPassword = (body, errors, field = "password") => {
  checkPasswordPresent(body, errors, field);

  if (
    typeof body[field] === "string" &&
    (body[field].length < MIN_PASSWORD_LENGTH ||
      Buffer.byteLength(body[field]) > MAX_PASSWORD_LENGTH)
  ) {
    errors.push(`${field} must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`);
  }
};

const rejectFields = (body, fields, errors, hint) => {
  for (const field of fields) {
    if (body[field] !== undefined) {
      errors.push(`${field} cannot be changed here${hint ? `; ${hint}` : ""}`);
    }
  }
};

// Wraps a check function into Express middleware that fails with a 400
const validate = (check) => (req, res, next) => {
  req.body = req.body || {};

  const errors = [];
  check(req, errors);

  if (errors.length > 0) {
    return next(new AppError("Validation failed", 400, errors));
  }

  next();
};

const validateRegister = validate(({ body }, errors) => {
  checkName(body, errors, { required: true });
  checkEmail(body, errors);
  checkNewPassword(body, errors);
});

const validateLogin = validate(({ body }, errors) => {
  checkEmail(body, errors);
  checkPasswordPresent(body, errors);
});

const validateUpdateProfile = validate(({ body }, errors) => {
  rejectFields(body, ["password"], errors, "use PATCH /api/auth/password");
  rejectFields(body, ["role", "isActive"], errors, "only an administrator can change it");

  if (!isPresent(body.name) && !isPresent(body.email)) {
    errors.push("Provide name or email to update");
  }

  checkName(body, errors);
  checkEmail(body, errors, { required: false });
});

const validateChangePassword = validate(({ body }, errors) => {
  checkPasswordPresent(body, errors, "currentPassword");
  checkNewPassword(body, errors, "newPassword");

  if (typeof body.newPassword === "string" && body.newPassword === body.currentPassword) {
    errors.push("newPassword must be different from currentPassword");
  }
});

module.exports = {
  isPresent,
  checkName,
  checkEmail,
  checkNewPassword,
  rejectFields,
  validate,
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
};
