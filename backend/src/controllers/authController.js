/**
 * AayuCare - Auth Controller
 * Custom endpoints extending Better Auth
 * Fully refactored to use PostgreSQL repository pattern
 */

const { getAuth } = require("../lib/auth");
const { AppError } = require("../middleware/errorHandler");
const userRepository = require("../repositories/userRepository");
const doctorRepository = require("../repositories/doctorRepository");
const patientRepository = require("../repositories/patientRepository");
const { createUserWithProfile } = require("../utils/transaction");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const {
  invalidateAfterAuthProfileMutation,
  invalidateAfterPasswordMutation,
} = require("../utils/cacheInvalidation");
const { writeAuditLog, AUDIT_ACTIONS } = require("../utils/audit");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/**
 * @desc    Get user email by userId (for Better Auth login)
 * @route   POST /api/user/email-by-userid
 * @access  Public
 */
exports.getEmailByUserId = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    // Validate userId parameter
    if (!userId || typeof userId !== 'string' || userId.length === 0) {
      return sendError(res, req, 'User ID is required.', 400, 'VALIDATION_ERROR');
    }
    
    // Exact-match policy: preserve input as-is and reject hidden whitespace differences.
    if (userId !== userId.trim()) {
      return sendError(
        res,
        req,
        'User ID must match exactly. Remove leading or trailing spaces and use exact uppercase/lowercase.',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (userId.length > 50) {
      return sendError(res, req, 'User ID format is invalid.', 400, 'VALIDATION_ERROR');
    }

    // Strict case-sensitive lookup against stored user_id.
    let user = await userRepository.findByUserId(userId);

    if (!user) {
      return sendError(
        res,
        req,
        'Invalid User ID. Enter the exact ID as provided (uppercase/lowercase must match).',
        404,
        'NOT_FOUND'
      );
    }

    return sendSuccess(res, req, {
      email: user.email,
    }, 'User email retrieved successfully');
  } catch (error) {
    logger.error("Error in getEmailByUserId", {
      error: error.message,
      stack: error.stack,
      userId: req.body.userId
    });
    next(error);
  }
};

/**
 * @desc    Get current session token (for mobile apps after Better Auth login)
 * @route   POST /api/user/current-session
 * @access  Private (requires authentication)
 */
exports.getCurrentSession = async (req, res, next) => {
  try {
    // Use authenticated user's UUID — never trust req.body.userId
    const userId = req.user.id;

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
      return sendError(res, req, 'No active session found', 404, 'NOT_FOUND');
    }

    const session = result.rows[0];

    return sendSuccess(res, req, {
      token: session.token,
      expiresAt: session.expiresAt,
    }, 'Session token retrieved successfully');
  } catch (error) {
    logger.error("Error in getCurrentSession", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get current session token after login (mobile bearer token exchange)
 * @route   POST /api/user/session-token
 * @access  Public (rate-limited, credential-verified)
 */
exports.getSessionTokenByCredentials = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, req, 'Email/User ID and password are required exactly as provided.', 400, 'VALIDATION_ERROR');
    }

    const user = await userRepository.findByEmail(String(email), true);
    if (!user || !user.password_hash || !user.is_active) {
      return sendError(
        res,
        req,
        'Invalid credentials. Enter the exact User ID/email and password.',
        401,
        'UNAUTHORIZED'
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return sendError(
        res,
        req,
        'Invalid credentials. Enter the exact User ID/email and password.',
        401,
        'UNAUTHORIZED'
      );
    }

    const { query } = require("../config/postgres");

    // Better Auth can persist session rows asynchronously right after sign-in.
    // Retry briefly to avoid race conditions in mobile login flow.
    let session = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await query(
        `SELECT token, expires_at as "expiresAt"
         FROM session
         WHERE user_id = $1
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id]
      );

      if (result.rows.length > 0) {
        session = result.rows[0];
        break;
      }

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    if (!session) {
      return sendError(res, req, 'No active session found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, req, {
      token: session.token,
      expiresAt: session.expiresAt,
    }, 'Session token retrieved successfully');
  } catch (error) {
    logger.error("Error in getSessionTokenByCredentials", {
      error: error.message,
      stack: error.stack,
      email: req.body?.email,
    });
    next(error);
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
      return sendError(res, req, 'Email is required', 400, 'VALIDATION_ERROR');
    }

    // Query PostgreSQL users table
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return sendError(res, req, 'User not found', 404, 'NOT_FOUND');
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
    } else if (user.role === "doctor") {
      // Fetch doctor profile
      const doctor = await doctorRepository.findByUserId(user.id);
      if (doctor) {
        userProfile.specialization = doctor.specialization;
        userProfile.qualification = doctor.qualification;
        userProfile.experience = doctor.experience;
        userProfile.consultationFee = doctor.consultation_fee;
        userProfile.availability = doctor.availability || {};
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
        userProfile.emergencyContactRelation = patient.emergency_contact_relation || null;
        userProfile.emergencyContact = {
          name: patient.emergency_contact_name || null,
          phone: patient.emergency_contact_phone || null,
          relation: patient.emergency_contact_relation || null,
        };
        userProfile.allergies = patient.allergies || [];
        userProfile.chronicConditions = patient.chronic_conditions || [];
        userProfile.medicalHistory = patient.chronic_conditions || [];
      }
    }

    return sendSuccess(res, req, userProfile, 'User profile retrieved successfully');
  } catch (error) {
    logger.error("Error in getProfileByEmail", {
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });
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
    return sendSuccess(res, req, {
      user: req.user,
      session: req.session,
    }, 'Current user retrieved successfully');
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
        "emergencyContactRelation",
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
    try {
      await invalidateAfterAuthProfileMutation();
      logger.debug("Cache invalidated after profile update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.PROFILE_UPDATE,
      entityType: "user",
      entityId: req.user.id,
      newValues: filteredUpdates,
      req,
    });

    return sendSuccess(res, req, { user }, 'Profile updated successfully');
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

    const user = await userRepository.findByEmail(req.user.email, true);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValid) {
      return next(new AppError("Current password incorrect", 401));
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await userRepository.update(req.user.id, { password_hash: passwordHash });

    // Invalidate session-related caches after password change
    try {
      await invalidateAfterPasswordMutation(req.user.id);
      logger.debug("Cache invalidated after password change");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
      entityType: "user",
      entityId: req.user.id,
      req,
    });

    return sendSuccess(res, req, {}, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Expo push token
 * @route   PUT /api/user/push-token
 * @access  Private
 */
exports.updatePushToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendError(res, req, 'Push token is required', 400, 'VALIDATION_ERROR');
    }

    // Update user in PostgreSQL (we added expo_push_token to the schema)
    await userRepository.update(req.user.id, { expo_push_token: token });

    return sendSuccess(res, req, {}, 'Push token updated successfully');
  } catch (error) {
    logger.error("Error updating push token", {
      error: error.message,
      userId: req.user.id
    });
    next(error);
  }
};
