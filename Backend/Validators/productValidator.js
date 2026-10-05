

const ALLOWED_FIELDS = [
  "name",
  "sku",
  "description",
  "category",
  "price",
  "quantity",
  "reorderLevel",
  "supplier",
];

const isBlank = (v) => typeof v !== "string" || v.trim() === "";
const isNonNegativeNumber = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const isNonNegativeInt = (v) => Number.isInteger(v) && v >= 0;

const pickAllowed = (body = {}) => {
  const clean = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (body[field] !== undefined) clean[field] = body[field];
  });
  return clean;
};

// partial = true for updates (only validate the fields that were sent)
const collectErrors = (data, partial) => {
  const errors = [];
  const has = (f) => data[f] !== undefined;

  if (!partial || has("name")) {
    if (isBlank(data.name)) errors.push("name is required and must be text");
  }
  if (!partial || has("sku")) {
    if (isBlank(data.sku)) errors.push("sku is required and must be text");
  }
  if (!partial || has("price")) {
    if (!isNonNegativeNumber(data.price)) errors.push("price is required and must be a number of 0 or more");
  }
  if (has("quantity") && !isNonNegativeInt(data.quantity)) {
    errors.push("quantity must be a whole number of 0 or more");
  }
  if (has("reorderLevel") && !isNonNegativeInt(data.reorderLevel)) {
    errors.push("reorderLevel must be a whole number of 0 or more");
  }
  if (has("category") && isBlank(data.category)) errors.push("category must be text");
  if (has("description") && typeof data.description !== "string") errors.push("description must be text");

  if (partial && Object.keys(data).length === 0) {
    errors.push("Send at least one valid field to update");
  }
  return errors;
};

const buildValidator = (partial) => (req, res, next) => {
  const data = pickAllowed(req.body);
  const errors = collectErrors(data, partial);

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  req.body = data;
  next();
};

const validateCreateProduct = buildValidator(false);
const validateUpdateProduct = buildValidator(true);

// For PATCH /:id/stock  ->  { "change": 5 } adds stock, { "change": -3 } removes stock
const validateStockAdjustment = (req, res, next) => {
  const { change } = req.body || {};
  if (!Number.isInteger(change) || change === 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: ["change is required and must be a non-zero whole number (e.g. 5 or -3)"],
    });
  }
  req.body = { change };
  next();
};

module.exports = { validateCreateProduct, validateUpdateProduct, validateStockAdjustment };
