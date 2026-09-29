// Small custom error so services can say "this is a 404" or "this is a 400"
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
