const authService = require("../Services/authService");
const AppError = require("../Utils/AppError");

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  return scheme === "Bearer" && token ? token : null;
};

// Requires a valid JWT for an active account and attaches the user to req.user.
// The role is read from the database, so role changes take effect immediately.
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

  // Logout, a password change or a password reset bumps tokenVersion
  if ((payload.v || 0) !== (user.tokenVersion || 0)) {
    return next(new AppError("Not authorized, token has been revoked", 401));
  }

  if (user.isActive === false) {
    return next(new AppError("This account has been deactivated", 403));
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

// Lets an admin turn off public sign-up with ALLOW_REGISTRATION=false
const registrationOpen = (req, res, next) => {
  if (process.env.ALLOW_REGISTRATION === "false") {
    return next(
      new AppError("Public registration is disabled; ask an administrator for an account", 403)
    );
  }

  next();
};

module.exports = {
  protect,
  authorize,
  registrationOpen
};
