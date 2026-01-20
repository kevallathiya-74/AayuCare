const authService = require("../services/betterAuthService");
const { AppError } = require("../middleware/errorHandler");
const User = require("../models/User");

exports.register = async (req, res, next) => {
  try {
    const { user, session } = await authService.register(req.body);

    res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: {
        user,
        token: session.token,
        refreshToken: session.token, // Better Auth uses same token
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user (Admin, Doctor, or Patient)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    const { user, session, token, refreshToken } = await authService.login(
      userId,
      password
    );

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user,
        token: token || session?.token,
        refreshToken: refreshToken || session?.token,
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.refreshSession(refreshToken);

    res.status(200).json({
      status: "success",
      message: "Session refreshed successfully",
      data: {
        token: refreshToken, // Better Auth manages refresh automatically
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    await authService.logout(token);

    res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
