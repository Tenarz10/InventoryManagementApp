const AppError = require("../Utils/AppError");
const { MIN_PASSWORD_LENGTH } = require("../Utils/authConstants");

const MAX_NAME_LENGTH = 100;
// bcrypt only uses the first 72 bytes of a password
const MAX_PASSWORD_LENGTH = 72;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPresent = (value) => value !== undefined && value !== null && value !== "";

const checkEmail = (body, errors) => {
  if (!isPresent(body.email)) {
    errors.push("email is required");
  } else if (typeof body.email !== "string" || !EMAIL_PATTERN.test(body.email.trim())) {
    errors.push("email must be a valid email address");
  } else {
    body.email = body.email.trim();
  }
};

const checkPasswordPresent = (body, errors) => {
  if (!isPresent(body.password)) {
    errors.push("password is required");
  } else if (typeof body.password !== "string") {
    errors.push("password must be text");
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
  if (!isPresent(body.name)) {
    errors.push("name is required");
  } else if (typeof body.name !== "string" || body.name.trim().length > MAX_NAME_LENGTH) {
    errors.push(`name must be text of at most ${MAX_NAME_LENGTH} characters`);
  }

  checkEmail(body, errors);
  checkPasswordPresent(body, errors);

  if (
    typeof body.password === "string" &&
    (body.password.length < MIN_PASSWORD_LENGTH ||
      Buffer.byteLength(body.password) > MAX_PASSWORD_LENGTH)
  ) {
    errors.push(
      `password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`
    );
  }
});

const validateLogin = validate(({ body }, errors) => {
  checkEmail(body, errors);
  checkPasswordPresent(body, errors);
});

module.exports = {
  validateRegister,
  validateLogin
};
