const authService = require("../Services/authService");
const AppError = require("../Utils/AppError");

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  return scheme === "Bearer" && token ? token : null;
};

// Requires a valid JWT and attaches the logged-in user to req.user
const protect = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return next(new AppError("Not authorized, no token provided", 401));
  }

  let payload;
  try {
    payload = authService.verifyToken(token);
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Not authorized, token has expired"
        : "Not authorized, invalid token";
    return next(new AppError(message, 401));
  }

  const user = await authService.getUserById(payload.id);

  if (!user) {
    return next(new AppError("Not authorized, user no longer exists", 401));
  }

  req.user = user;
  next();
};

// Restricts a route to the given roles; use after protect
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }

    next();
  };

module.exports = {
  protect,
  authorize
};
