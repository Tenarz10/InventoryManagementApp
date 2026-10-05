const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const AppError = require("../Utils/AppError");
const { DEFAULT_JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } = require("../Utils/authConstants");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return process.env.JWT_SECRET;
};

// v is the user's tokenVersion; protect rejects tokens whose version is out of date
const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), role: user.role, v: user.tokenVersion || 0 },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN }
  );

// Throws jsonwebtoken errors (JsonWebTokenError, TokenExpiredError) on a bad token
const verifyToken = (token) => jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });

// Compared against when the email is unknown, so a login takes the same time either way
let dummyHashPromise;
const getDummyHash = () => {
  dummyHashPromise = dummyHashPromise || bcrypt.hash("dummy-password", BCRYPT_SALT_ROUNDS);
  return dummyHashPromise;
};

const ensureEmailAvailable = async (email, exceptUserId) => {
  const existing = await User.exists({
    email: email.toLowerCase(),
    ...(exceptUserId && { _id: { $ne: exceptUserId } })
  });

  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }
};

const register = async ({ name, email, password }) => {
  await ensureEmailAvailable(email);

  // Role is never taken from the request; new accounts get the default role
  const user = await User.create({ name, email, password });

  return { user, token: signToken(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password +tokenVersion"
  );

  if (!user) {
    await bcrypt.compare(password, await getDummyHash());
    throw new AppError("Invalid email or password", 401);
  }

  if (!(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  // Only revealed after a correct password, so it does not leak which emails exist
  if (!user.isActive) {
    throw new AppError("This account has been deactivated", 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return { user, token: signToken(user) };
};

// Includes tokenVersion so protect can check it
const getUserById = (id) => User.findById(id).select("+tokenVersion");

const updateProfile = async (userId, { name, email }) => {
  if (email) {
    await ensureEmailAvailable(email, userId);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { ...(name && { name: name.trim() }), ...(email && { email }) },
    { returnDocument: "after", runValidators: true }
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

// Revokes every existing token (all devices) and returns a fresh one for this session
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password +tokenVersion");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect", 401);
  }

  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();

  return { user, token: signToken(user) };
};

// Signs the user out everywhere by invalidating all of their tokens
const logout = async (userId) => {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
};

module.exports = {
  signToken,
  verifyToken,
  ensureEmailAvailable,
  register,
  login,
  getUserById,
  updateProfile,
  changePassword,
  logout
};
