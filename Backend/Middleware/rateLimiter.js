const { rateLimit } = require("express-rate-limit");
const AppError = require("../Utils/AppError");

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const createLimiter = ({ windowMs, limit, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res, next) => next(new AppError(message, 429))
  });

// Only failed attempts count, so a user who logs in successfully is never locked out
const loginLimiter = createLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts, please try again in 15 minutes"
});

const registerLimiter = createLimiter({
  windowMs: ONE_HOUR,
  limit: 5,
  message: "Too many accounts created from this address, please try again later"
});

// Guards the current-password check against guessing with a stolen token
const passwordLimiter = createLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  skipSuccessfulRequests: true,
  message: "Too many password change attempts, please try again in 15 minutes"
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordLimiter
};
