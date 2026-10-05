const mongoose = require("mongoose");
const AppError = require("../Utils/AppError");
const { MOVEMENT_TYPES, STOCK_STATUS } = require("../Utils/stockConstants");

const MAX_TEXT_LENGTH = 500;

// Form submissions send numbers as strings; JSON sends real numbers
const toNumber = (value) =>
  typeof value === "string" && value.trim() !== "" ? Number(value) : value;

const isPresent = (value) => value !== undefined && value !== null && value !== "";

const checkInteger = (body, field, errors, { required = false, min = 0 } = {}) => {
  if (!isPresent(body[field])) {
    if (required) errors.push(`${field} is required`);
    return;
  }

  const value = toNumber(body[field]);

  if (!Number.isInteger(value) || value < min) {
    errors.push(`${field} must be a whole number of at least ${min}`);
    return;
  }

  body[field] = value;
};

const checkText = (body, field, errors, { required = false } = {}) => {
  if (!isPresent(body[field])) {
    if (required) errors.push(`${field} is required`);
    return;
  }

  if (typeof body[field] !== "string") {
    errors.push(`${field} must be text`);
  } else if (body[field].length > MAX_TEXT_LENGTH) {
    errors.push(`${field} must be at most ${MAX_TEXT_LENGTH} characters`);
  }
};

const checkLevels = (body, errors) => {
  if (
    Number.isInteger(body.reorderLevel) &&
    Number.isInteger(body.maxLevel) &&
    body.maxLevel > 0 &&
    body.maxLevel < body.reorderLevel
  ) {
    errors.push("maxLevel must be greater than or equal to reorderLevel");
  }
};

const checkDate = (query, field, errors) => {
  if (isPresent(query[field]) && Number.isNaN(new Date(query[field]).getTime())) {
    errors.push(`${field} must be a valid date`);
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

const validateProductIdParam = validate((req, errors) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    errors.push("productId must be a valid id");
  }
});

const validateCreateStock = validate(({ body }, errors) => {
  if (!isPresent(body.product)) {
    errors.push("product is required");
  } else if (!mongoose.isValidObjectId(body.product)) {
    errors.push("product must be a valid id");
  }

  checkInteger(body, "quantity", errors);
  checkInteger(body, "reorderLevel", errors);
  checkInteger(body, "maxLevel", errors);
  checkText(body, "location", errors);
  checkLevels(body, errors);
});

const validateUpdateStock = validate(({ body }, errors) => {
  if (isPresent(body.quantity)) {
    errors.push("quantity cannot be updated directly; use stock in, stock out or adjust");
  }

  if (!["reorderLevel", "maxLevel", "location"].some((field) => isPresent(body[field]))) {
    errors.push("Provide at least one of reorderLevel, maxLevel or location");
  }

  checkInteger(body, "reorderLevel", errors);
  checkInteger(body, "maxLevel", errors);
  checkText(body, "location", errors);
  checkLevels(body, errors);
});

// Stock in / stock out: quantity is the number of units moved
const validateStockMovement = validate(({ body }, errors) => {
  checkInteger(body, "quantity", errors, { required: true, min: 1 });
  checkText(body, "reason", errors);
  checkText(body, "reference", errors);
  checkText(body, "note", errors);
});

// Adjustment: quantity is the new counted total, and a reason is mandatory
const validateStockAdjustment = validate(({ body }, errors) => {
  checkInteger(body, "quantity", errors, { required: true, min: 0 });
  checkText(body, "reason", errors, { required: true });
  checkText(body, "reference", errors);
  checkText(body, "note", errors);
});

const validateStockQuery = validate(({ query }, errors) => {
  if (isPresent(query.status) && !Object.values(STOCK_STATUS).includes(query.status)) {
    errors.push(`status must be one of: ${Object.values(STOCK_STATUS).join(", ")}`);
  }
});

const validateMovementQuery = validate(({ query }, errors) => {
  if (isPresent(query.type) && !Object.values(MOVEMENT_TYPES).includes(query.type)) {
    errors.push(`type must be one of: ${Object.values(MOVEMENT_TYPES).join(", ")}`);
  }

  if (isPresent(query.product) && !mongoose.isValidObjectId(query.product)) {
    errors.push("product must be a valid id");
  }

  checkDate(query, "from", errors);
  checkDate(query, "to", errors);
});

module.exports = {
  validateProductIdParam,
  validateCreateStock,
  validateUpdateStock,
  validateStockMovement,
  validateStockAdjustment,
  validateStockQuery,
  validateMovementQuery
};
