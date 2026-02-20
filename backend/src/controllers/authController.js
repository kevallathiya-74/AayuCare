/**
 * AayuCare - Auth Controller
 * Custom endpoints extending Better Auth
 * Fully refactored to use repository pattern where applicable
 * Note: Better Auth-specific MongoDB queries remain for session management
 */

const { getAuth } = require("../lib/auth");
const { AppError } = require("../middleware/errorHandler");
const userRepository = require("../repositories/userRepository");
const doctorRepository = require("../repositories/doctorRepository");
const patientRepository = require("../repositories/patientRepository");
const { createUserWithProfile } = require("../utils/transaction");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

/**
 * @desc    Get user email by userId (for Better Auth login)
 * @route   POST /api/user/email-by-userid
 * @access  Public
 */
exports.getEmailByUserId = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    // Validate userId parameter
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Valid userId is required' 
      });
    }
    
    // Sanitize userId (prevent injection)
    const sanitizedUserId = userId.trim();
    if (sanitizedUserId.length > 50) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid userId format' 
      });
    }

    // Try PostgreSQL first
    const userIdUppercase = sanitizedUserId.toUpperCase();
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
    logger.error("Error in getEmailByUserId", {
      error: error.message,
      stack: error.stack,
      userId: req.body.userId
    });
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

    // Query PostgreSQL session table (Better Auth uses PostgreSQL now)
    const { query } = require("../config/postgres");
    
    // Find the most recent valid session for this user
    const result = await query(
      `SELECT token, expires_at as "expiresAt"
       FROM session
       WHERE user_id = $1
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No active session found",
      });
    }

    const session = result.rows[0];

    res.status(200).json({
      status: "success",
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    logger.error("Error in getCurrentSession", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
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

    // Query PostgreSQL users table
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Return user-friendly data (no password hash)
    const userProfile = {
      id: user.id,
      userId: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hospitalId: user.hospital_id,
      hospitalName: user.hospital_name,
      isActive: user.is_active,
      isVerified: user.email_verified,
    };

    // Add role-specific fields from related tables
    if (user.role === "admin") {
      // Admin-specific fields can be added here if needed
      userProfile.department = user.department; // If exists in users table
    } else if (user.role === "doctor") {
      // Fetch doctor profile
      const doctor = await doctorRepository.findByUserId(user.id);
      if (doctor) {
        userProfile.specialization = doctor.specialization;
        userProfile.qualification = doctor.qualification;
        userProfile.experience = doctor.experience;
        userProfile.consultationFee = doctor.consultation_fee;
        userProfile.availableFrom = doctor.available_from;
        userProfile.availableTo = doctor.available_to;
      }
    } else if (user.role === "patient") {
      // Fetch patient profile
      const patient = await patientRepository.findByUserId(user.id);
      if (patient) {
        userProfile.dateOfBirth = patient.date_of_birth;
        userProfile.gender = patient.gender;
        userProfile.bloodGroup = patient.blood_group;
        userProfile.address = patient.address;
        userProfile.emergencyContactName = patient.emergency_contact_name;
        userProfile.emergencyContactPhone = patient.emergency_contact_phone;
        userProfile.emergencyContact = {
          name: patient.emergency_contact_name || null,
          phone: patient.emergency_contact_phone || null,
          relation: null,
        };
        userProfile.allergies = patient.allergies || [];
        userProfile.chronicConditions = patient.chronic_conditions || [];
        userProfile.medicalHistory = patient.chronic_conditions || [];
      }
    }

    res.status(200).json({
      status: "success",
      data: userProfile,
    });
  } catch (error) {
    logger.error("Error in getProfileByEmail", {
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });
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
 * @desc    Update user profile - Uses PostgreSQL
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      "name",
      "phone",
    ];

    const filteredUpdates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = req.body[key];
      }
    });

    // Update user in PostgreSQL
    const user = await userRepository.update(req.user.id, filteredUpdates);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Update role-specific profile
    if (req.user.role === "doctor") {
      const doctorUpdates = {};
      [
        "specialization",
        "qualification",
        "experience",
        "consultationFee",
        "department",
        "bio",
        "availability",
      ].forEach((key) => {
        if (req.body[key] !== undefined) {
          doctorUpdates[key] = req.body[key];
        }
      });

      if (Object.keys(doctorUpdates).length > 0) {
        await doctorRepository.update(req.user.id, doctorUpdates);
      }
    } else if (req.user.role === "patient") {
      const patientUpdates = {};
      [
        "dateOfBirth",
        "gender",
        "bloodGroup",
        "allergies",
        "chronicConditions",
        "address",
        "emergencyContactName",
        "emergencyContactPhone",
      ].forEach((key) => {
        if (req.body[key] !== undefined) {
          patientUpdates[key] = req.body[key];
        }
      });

      if (Object.keys(patientUpdates).length > 0) {
        await patientRepository.update(req.user.id, patientUpdates);
      }
    }

    // Invalidate relevant caches after profile update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:*patients*");
      await deleteCacheByPattern("cache:*");
      logger.debug("Cache invalidated after profile update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

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
 * @desc    Change password - Uses PostgreSQL
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
      return next(
        new AppError(
          "New password must be different from current password",
          400
        )
      );
    }

    const user = await userRepository.findById(req.user.id, true);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify current password (you'll need bcrypt)
    const bcrypt = require("bcrypt");
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValid) {
      return next(new AppError("Current password incorrect", 401));
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await userRepository.update(req.user.id, { password_hash: passwordHash });

    // Invalidate session-related caches after password change
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:session:*");
      await deleteCacheByPattern("cache:session:*");
      await deleteCacheByPattern(`v1:cache:user:${req.user.id}:*`);
      await deleteCacheByPattern(`cache:user:${req.user.id}:*`);
      logger.debug("Cache invalidated after password change");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
