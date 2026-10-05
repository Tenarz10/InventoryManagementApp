const User = require("../Models/User");
const AppError = require("../Utils/AppError");
const { ROLES } = require("../Utils/authConstants");
const { ensureEmailAvailable } = require("./authService");
const { getPagination, buildPaginationMeta } = require("./stockService");

const findUserOrFail = async (userId, select) => {
  const query = User.findById(userId);
  const user = await (select ? query.select(select) : query);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const isSameUser = (a, b) => a._id.toString() === b._id.toString();

// Stops the system from ending up with no one able to manage users
const ensureAnotherActiveAdmin = async (user) => {
  const otherAdmins = await User.countDocuments({
    _id: { $ne: user._id },
    role: ROLES.ADMIN,
    isActive: true
  });

  if (otherAdmins === 0) {
    throw new AppError("This is the last active admin; promote another admin first", 400);
  }
};

// Query values arrive as strings
const toBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

const listUsers = async (query = {}) => {
  const filter = {};
  const isActive = toBoolean(query.isActive);

  if (query.role) filter.role = query.role;
  if (isActive !== undefined) filter.isActive = isActive;

  const pagination = getPagination(query);

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    User.countDocuments(filter)
  ]);

  return { items, pagination: buildPaginationMeta(pagination, total) };
};

const getUser = (userId) => findUserOrFail(userId);

// Unlike public registration, an admin may choose the role
const createUser = async ({ name, email, password, role }) => {
  await ensureEmailAvailable(email);

  return User.create({ name, email, password, ...(role && { role }) });
};

const updateUser = async (userId, { name, email, role, isActive }, actingUser) => {
  const user = await findUserOrFail(userId);

  const losesAdmin =
    user.role === ROLES.ADMIN &&
    ((role !== undefined && role !== ROLES.ADMIN) || isActive === false);

  if (losesAdmin && isSameUser(user, actingUser)) {
    throw new AppError("You cannot remove your own admin role or deactivate your own account", 400);
  }

  if (losesAdmin && user.isActive) {
    await ensureAnotherActiveAdmin(user);
  }

  if (email) {
    await ensureEmailAvailable(email, user._id);
    user.email = email;
  }
  if (name) user.name = name.trim();
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  return user.save();
};

// Sets a new password and signs the user out of every device
const resetPassword = async (userId, { newPassword }) => {
  const user = await findUserOrFail(userId, "+tokenVersion");

  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();

  return user;
};

const deleteUser = async (userId, actingUser) => {
  const user = await findUserOrFail(userId);

  if (isSameUser(user, actingUser)) {
    throw new AppError("You cannot delete your own account", 400);
  }

  if (user.role === ROLES.ADMIN && user.isActive) {
    await ensureAnotherActiveAdmin(user);
  }

  await user.deleteOne();
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  resetPassword,
  deleteUser
};
