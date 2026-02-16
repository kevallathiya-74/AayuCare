/**
 * AayuCare - Auth Controller
 * Custom endpoints extending Better Auth
 * Refactored to use repository pattern
 */

const { getAuth } = require("../lib/auth");
const { AppError } = require("../middleware/errorHandler");
const User = require("../models/User");
const userRepository = require("../repositories/userRepository");
const doctorRepository = require("../repositories/doctorRepository");
const patientRepository = require("../repositories/patientRepository");
const { createUserWithProfile } = require("../utils/transaction");
const mongoose = require("mongoose");

/**
 * @desc    Get user email by userId (for Better Auth login)
 * @route   POST /api/user/email-by-userid
 * @access  Public
 */
exports.getEmailByUserId = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
    }

    // Try PostgreSQL first
    const userIdUppercase = userId.toString().trim().toUpperCase();
    let user = await userRepository.findByUserId(userIdUppercase);

    // Fallback to MongoDB for backward compatibility
    if (!user) {
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          status: "error",
          message: "Database not available",
        });
      }

      const db = mongoose.connection.getClient().db("aayucare");
      const userCollection = db.collection("user");
      user = await userCollection.findOne({ userId: userIdUppercase });
    }

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      email: user.email,
    });
  } catch (error) {
    console.error("[AuthController] Error in getEmailByUserId:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
};

/**
 * @desc    Get current session token (for mobile apps after Better Auth login)
 * @route   POST /api/user/current-session
 * @access  Public (called immediately after Better Auth login)
 */
exports.getCurrentSession = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
    }

    const db = mongoose.connection.getClient().db("aayucare");
    const sessionCollection = db.collection("session");

    // Find the most recent valid session for this user
    const session = await sessionCollection.findOne(
      {
        userId: new mongoose.Types.ObjectId(userId),
        expiresAt: { $gt: new Date() },
      },
      {
        sort: { createdAt: -1 },
      }
    );

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "No active session found",
      });
    }

    res.status(200).json({
      status: "success",
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("[AuthController] Error in getCurrentSession:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
};

/**
 * @desc    Get user profile by email (for post-login data fetch)
 * @route   POST /api/user/profile-by-email
 * @access  Public (called after Better Auth login)
 */
exports.getProfileByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const db = mongoose.connection.getClient().db("aayucare");
    const userCollection = db.collection("user");

    const user = await userCollection.findOne({ email: email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Return user-friendly data (no MongoDB _id, passwords, etc.)
    const userProfile = {
      id: user._id.toString(),
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hospitalId: user.hospitalId,
      hospitalName: user.hospitalName,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };

    // Add role-specific fields
    if (user.role === "admin") {
      userProfile.department = user.department;
    } else if (user.role === "doctor") {
      userProfile.specialization = user.specialization;
      userProfile.qualification = user.qualification;
      userProfile.experience = user.experience;
      userProfile.consultationFee = user.consultationFee;
    } else if (user.role === "patient") {
      userProfile.dateOfBirth = user.dateOfBirth;
      userProfile.gender = user.gender;
      userProfile.bloodGroup = user.bloodGroup;
      userProfile.address = user.address;
      userProfile.emergencyContact = user.emergencyContact;
    }

    res.status(200).json({
      status: "success",
      data: userProfile,
    });
  } catch (error) {
    console.error("[AuthController] Error in getProfileByEmail:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
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
