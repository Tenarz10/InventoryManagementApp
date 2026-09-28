const errorHandler = (
  error,
  req,
  res,
  next
) => {
  console.error(error);

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const messages = Object.values(
      error.errors
    ).map((err) => err.message);

    return res.status(400).json({
      success: false,
      message: "Validation error",
      data: messages,
    });
  }

  // Invalid MongoDB ObjectId
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID",
      data: null,
    });
  }

  // Duplicate MongoDB value
  if (error.code === 11000) {
    const field = Object.keys(
      error.keyPattern
    )[0];

    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      data: null,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    data: null,
  });
};

module.exports = errorHandler;