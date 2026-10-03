const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const AppError = require("../Utils/AppError");
const { DEFAULT_JWT_EXPIRES_IN } = require("../Utils/authConstants");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return process.env.JWT_SECRET;
};

const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN
  });

// Throws jsonwebtoken errors (JsonWebTokenError, TokenExpiredError) on a bad token
const verifyToken = (token) => jwt.verify(token, getJwtSecret());

const register = async ({ name, email, password }) => {
  const existing = await User.exists({ email: email.toLowerCase() });

  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  // Role is never taken from the request; new accounts get the default role
  const user = await User.create({ name, email, password });

  return { user, token: signToken(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  return { user, token: signToken(user) };
};

const getUserById = (id) => User.findById(id);

module.exports = {
  signToken,
  verifyToken,
  register,
  login,
  getUserById
};
