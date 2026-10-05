const authService = require("../Services/authService");

const register = async (req, res) => {
  const { user, token } = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    data: user
  });
};

const login = async (req, res) => {
  const { user, token } = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    token,
    data: user
  });
};

const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

const updateMe = async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);

  res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
};

const changePassword = async (req, res) => {
  const { user, token } = await authService.changePassword(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Password changed successfully; other sessions have been signed out",
    token,
    data: user
  });
};

const logout = async (req, res) => {
  await authService.logout(req.user._id);

  res.status(200).json({ success: true, message: "Logged out of all sessions" });
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  logout
};
