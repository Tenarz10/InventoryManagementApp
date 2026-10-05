const userService = require("../Services/userService");

const getAllUsers = async (req, res) => {
  const { items, pagination } = await userService.listUsers(req.query);

  res.status(200).json({ success: true, count: items.length, pagination, data: items });
};

const getUser = async (req, res) => {
  const user = await userService.getUser(req.params.userId);

  res.status(200).json({ success: true, data: user });
};

const createUser = async (req, res) => {
  const user = await userService.createUser(req.body);

  res.status(201).json({ success: true, message: "User created successfully", data: user });
};

const updateUser = async (req, res) => {
  const user = await userService.updateUser(req.params.userId, req.body, req.user);

  res.status(200).json({ success: true, message: "User updated successfully", data: user });
};

const resetPassword = async (req, res) => {
  await userService.resetPassword(req.params.userId, req.body);

  res.status(200).json({
    success: true,
    message: "Password reset successfully; the user has been signed out"
  });
};

const deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.userId, req.user);

  res.status(200).json({ success: true, message: "User deleted successfully" });
};

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  resetPassword,
  deleteUser
};
