// Global error handler; must be registered after all routes
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((error) => error.message);
  } else if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(", ")}`;
  } else if (err.type === "entity.parse.failed") {
    message = "Request body contains invalid JSON";
  }

  if (statusCode >= 500) {
    console.error(err);

    if (process.env.NODE_ENV === "production") {
      message = "Internal server error";
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { errors: details })
  });
};

module.exports = errorHandler;
