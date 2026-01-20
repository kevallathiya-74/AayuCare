/**
 * AayuCare - Auth Controller
 * Custom endpoints extending Better Auth
 */

const { getAuth } = require("../lib/auth");
const { AppError } = require("../middleware/errorHandler");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * @desc    Get user email by userId (for Better Auth login)
 * @route   POST /api/user/email-by-userid
 * @access  Public
 */
exports.getEmailByUserId = async (req, res, next) => {
  try {
    console.log('[AuthController] getEmailByUserId called');
    console.log('[AuthController] Request body:', req.body);
    
    const { userId } = req.body;

    if (!userId) {
      console.error('[AuthController] Missing userId in request');
      return res.status(400).json({
        status: "error",
        message: "User ID is required"
      });
    }

    // Check MongoDB connection
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.error('[AuthController] MongoDB not connected');
      return res.status(503).json({
        status: "error",
        message: "Database not available"
      });
    }

    // Better Auth stores users in 'user' collection
    const db = mongoose.connection.getClient().db("test");
    const userCollection = db.collection("user");

    console.log('[AuthController] Searching for userId:', userId);
    const user = await userCollection.findOne({ userId: userId });

    if (!user) {
      console.log('[AuthController] User not found:', userId);
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    console.log('[AuthController] User found:', user.email);
    res.status(200).json({
      status: "success",
      email: user.email,
    });
  } catch (error) {
    console.error('[AuthController] Error in getEmailByUserId:', error);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal server error"
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        user: req.user,
        session: req.session,
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
    const allowedUpdates = [
      "name",
      "phone",
      "address",
      "avatar",
      "specialization",
      "qualification",
      "experience",
      "consultationFee",
      "bloodGroup",
      "allergies",
      "currentMedications",
    ];

    const filteredUpdates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, filteredUpdates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return next(new AppError("Current password incorrect", 401));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
