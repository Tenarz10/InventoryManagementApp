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

module.exports = {
  register,
  login,
  getMe
};
