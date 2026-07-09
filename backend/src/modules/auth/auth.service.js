const userRepository = require("./user.repository");
const doctorRepository = require("../doctor/doctor.repository");
const patientRepository = require("../patient/patient.repository");
const authRepository = require("./auth.repository");
const { AppError } = require("../../middleware/errorHandler");
const { getAuth } = require("../../lib/auth");
const { invalidateAfterAuthProfileMutation, invalidateAfterPasswordMutation } = require("../../utils/cacheInvalidation");
const bcrypt = require("bcryptjs");
const logger = require("../../utils/logger");

/**
 * Auth Service - Handles authentication business logic
 * Architecture: Controller -> Service -> Repository -> Database/Library
 */
class AuthService {
  /**
   * Get user email by userId (for Better Auth login)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User email
   */
  async getEmailByUserId(userId) {
    // Validate userId parameter
    if (!userId || typeof userId !== 'string' || userId.length === 0) {
      throw new AppError('User ID is required.', 400, 'VALIDATION_ERROR');
    }

    // Exact-match policy: preserve input as-is and reject hidden whitespace differences.
    if (userId !== userId.trim()) {
      throw new AppError(
        'User ID must match exactly. Remove leading or trailing spaces and use exact uppercase/lowercase.',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (userId.length > 50) {
      throw new AppError('User ID format is invalid.', 400, 'VALIDATION_ERROR');
    }

    // Strict case-sensitive lookup against stored user_id.
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      throw new AppError(
        'Invalid User ID. Enter the exact ID as provided (uppercase/lowercase must match).',
        404,
        'NOT_FOUND'
      );
    }

    return {
      email: user.email,
    };
  }

  /**
   * Get current session token (for mobile apps after Better Auth login)
   * @param {string} userId - User UUID from req.user.id
   * @returns {Promise<Object>} Session token and expiration
   */
  async getCurrentSession(userId) {
    // Use authenticated user's UUID — never trust req.body.userId
    const sessions = await authRepository.findSessionsByUserId(userId);

    if (sessions.length === 0) {
      throw new AppError('No active session found', 404, 'NOT_FOUND');
    }

    // Return the most recent session (first in the list due to ORDER BY in repository)
    const session = sessions[0];

    // The returned `token` is `session.token_hash` — see JSDoc in controller.
    // Logged at debug level so future developers see a hint in their terminal
    // when this endpoint is exercised. No change to the response payload.
    logger.debug("[auth.getCurrentSession] returning session identifier (not a Bearer token)");

    return {
      token: session.token,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Get current session token after login (mobile bearer token exchange)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Session token and expiration
   */
  async getSessionTokenByCredentials(email, password, requestInfo = {}) {
    if (!email || !password) {
      throw new AppError('Email/User ID and password are required exactly as provided.', 400, 'VALIDATION_ERROR');
    }

    // 1. Find user by email (include password hash)
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw new AppError(
        'Invalid credentials. Enter the exact User ID/email and password.',
        401,
        'UNAUTHORIZED'
      );
    }

    // 2. Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError(
        'Invalid credentials. Enter the exact User ID/email and password.',
        401,
        'UNAUTHORIZED'
      );
    }

    if (user.is_active === false) {
      throw new AppError(
        'Your account has been deactivated. Please contact support.',
        403,
        'FORBIDDEN'
      );
    }

    // 3. Retrieve most recent active session from database
    const sessions = await authRepository.findSessionsByUserId(user.id);
    if (sessions.length > 0) {
      const session = sessions[0];
      return {
        token: session.token,
        expiresAt: session.expiresAt,
      };
    }

    // Fallback: Attempt Better Auth server-side sign-in if session does not exist in DB yet
    const auth = getAuth();
    try {
      const headers = new Headers();
      if (requestInfo.ip) {
        headers.set("x-forwarded-for", requestInfo.ip);
      }
      if (requestInfo.userAgent) {
        headers.set("user-agent", requestInfo.userAgent);
      }

      const result = await auth.api.signInEmail({
        body: { email: String(email), password: String(password) },
        headers,
      });

      if (result) {
        const activeSessions = await authRepository.findSessionsByUserId(user.id);
        if (activeSessions.length > 0) {
          const session = activeSessions[0];
          return {
            token: session.token,
            expiresAt: session.expiresAt,
          };
        }
      }
    } catch (e) {
      logger.error("Better Auth fallback signInEmail failed:", e.message);
    }

    throw new AppError('No active session found', 404, 'NOT_FOUND');
  }

  /**
   * Get user profile by email (for post-login data fetch)
   * @param {string} email - User email
   * @returns {Promise<Object>} User profile
   */
  async getProfileByEmail(email) {
    if (!email) {
      throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
    }

    // Query PostgreSQL users table
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
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

    return userProfile;
  }

  /**
   * Get current user profile
   * @param {Object} user - User object from req.user
   * @param {Object} session - Session object from req.session
   * @returns {Object} User and session data
   */
  async getMe(user, session) {
    return {
      user: user,
      session: session,
    };
  }

  /**
   * Update user profile
   * @param {string} userId - User UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updates) {
    const allowedUpdates = [
      "name",
      "email",
      "phone",
      "preferred_language",
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Update user in PostgreSQL
    const user = await userRepository.update(userId, filteredUpdates);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update role-specific profile
    const userDetails = await userRepository.findById(userId);
    if (userDetails.role === "doctor") {
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
        if (updates[key] !== undefined) {
          doctorUpdates[key] = updates[key];
        }
      });

      if (Object.keys(doctorUpdates).length > 0) {
        await doctorRepository.update(userId, doctorUpdates);
      }
    } else if (userDetails.role === "patient") {
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
        if (updates[key] !== undefined) {
          patientUpdates[key] = updates[key];
        }
      });

      if (Object.keys(patientUpdates).length > 0) {
        await patientRepository.update(userId, patientUpdates);
      }
    }

    // Invalidate relevant caches after profile update
    try {
      await invalidateAfterAuthProfileMutation();
      logger.debug("Cache invalidated after profile update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    // Audit log would be handled in controller
    return user;
  }

  /**
   * Change password
   * @param {string} userId - User UUID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result object
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (currentPassword === newPassword) {
      throw new AppError(
        "New password must be different from current password",
        400
      );
    }

    // Find user by ID first to get email
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValid) {
      throw new AppError("Current password incorrect", 401);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await userRepository.update(userId, { password_hash: passwordHash });

    // Invalidate session-related caches after password change
    try {
      await invalidateAfterPasswordMutation(userId);
      logger.debug("Cache invalidated after password change");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    // Invalidate all existing sessions for security
    await authRepository.invalidateUserSessions(userId);

    return { success: true };
  }

  /**
   * Update Expo push token
   * @param {string} userId - User UUID
   * @param {string} token - Expo push token
   * @returns {Promise<void>}
   */
  async updatePushToken(userId, token) {
    if (!token) {
      throw new AppError('Push token is required', 400, 'VALIDATION_ERROR');
    }

    // Update user in PostgreSQL (we added expo_push_token to the schema)
    await userRepository.update(userId, { expo_push_token: token });
  }
}

module.exports = new AuthService();