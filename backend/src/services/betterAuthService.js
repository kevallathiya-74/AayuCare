const { auth } = require("../config/betterAuth");
const User = require("../models/User");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * Better Auth Service
 * Handles authentication with Better Auth integration
 */

class BetterAuthService {
  /**
   * Register new user with Better Auth
   */
  async register(userData) {
    const {
      userId,
      email,
      phone,
      password,
      role,
      hospitalId,
      hospitalName,
      name,
      ...rest
    } = userData;

    try {
      // Validate hospitalId for multi-tenancy
      if (!hospitalId && role !== "super_admin") {
        throw new AppError("Hospital ID is required for registration", 400);
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ userId }, { email }, { phone }],
      });

      if (existingUser) {
        throw new AppError(
          "User with this ID, email, or phone already exists",
          400
        );
      }

      // Validate role-specific data
      this.validateRoleData(role, rest);

      // Create user in User model directly (Better Auth session will be created on login)
      const user = await User.create({
        userId,
        email,
        phone,
        password, // Will be hashed by pre-save hook
        name,
        role: role || "patient",
        hospitalId,
        hospitalName: hospitalName || "Hospital",
        isActive: true,
        isVerified: false,
        lastLogin: new Date(),
        ...rest,
      });

      logger.info(
        `New ${role} registered: ${userId} at hospital ${hospitalId}`
      );

      // Return user data with tokens for backwards compatibility
      // Generate JWT tokens for immediate login after registration
      const jwt = require("jsonwebtoken");
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "30d" }
      );

      return {
        user: user.toJSON(),
        token,
        refreshToken: token,
        session: { token, user: user.toJSON() },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Registration error:", error);
      throw new AppError(error.message || "Registration failed", 400);
    }
  }

  /**
   * Login user with Better Auth
   */
  async login(emailOrUserId, password) {
    try {
      if (!emailOrUserId || !password) {
        throw new AppError("Please provide email/user ID and password", 400);
      }

      // Find user by userId or email
      const user = await User.findOne({
        $or: [{ userId: emailOrUserId }, { email: emailOrUserId }],
      }).select("+password");

      if (!user) {
        throw new AppError("Invalid credentials", 401);
      }

      if (!user.isActive) {
        throw new AppError("Your account has been deactivated", 403);
      }

      // Verify password with User model method
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 401);
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${user.userId}`);

      // Generate JWT tokens for backwards compatibility
      const jwt = require("jsonwebtoken");
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "30d" }
      );

      return {
        user: user.toJSON(),
        token,
        refreshToken: token,
        session: { token, user: user.toJSON() },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Login error:", error);
      throw new AppError("Login failed. Please check your credentials", 401);
    }
  }

  /**
   * Logout user
   */
  async logout(sessionToken) {
    try {
      logger.info("User logged out successfully");
      return { success: true };
    } catch (error) {
      logger.error("Logout error:", error);
      throw new AppError("Logout failed", 500);
    }
  }

  /**
   * Get current user session
   */
  async getSession(headers) {
    try {
      // Extract token from headers
      const authHeader = headers?.authorization || headers?.Authorization;
      if (!authHeader) {
        return null;
      }

      const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

      // Verify JWT token
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id);
      if (!user) {
        return null;
      }

      return {
        user: user.toJSON(),
        session: { token, user: user.toJSON() },
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(sessionToken) {
    try {
      // Better Auth handles session refresh automatically
      return { success: true };
    } catch (error) {
      throw new AppError("Session refresh failed", 401);
    }
  }

  /**
   * Validate role-specific data
   */
  validateRoleData(role, data) {
    if (role === "doctor") {
      if (
        !data.specialization ||
        !data.qualification ||
        !data.experience ||
        !data.consultationFee
      ) {
        throw new AppError(
          "Doctor registration requires: specialization, qualification, experience, and consultation fee",
          400
        );
      }
    }

    if (role === "patient") {
      if (!data.dateOfBirth || !data.gender) {
        throw new AppError(
          "Patient registration requires: date of birth and gender",
          400
        );
      }
    }

    if (role === "admin") {
      if (!data.department) {
        throw new AppError("Admin registration requires: department", 400);
      }
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findOne({ userId }).select("+password");

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new AppError("Current password is incorrect", 401);
      }

      user.password = newPassword;
      user.tokenVersion += 1; // Invalidate all existing tokens
      await user.save();

      logger.info(`Password updated for user: ${userId}`);
      return { success: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Password update failed", 500);
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId) {
    try {
      const user = await User.findOne({ userId });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      user.isActive = false;
      user.tokenVersion += 1; // Invalidate all tokens
      await user.save();

      logger.info(`Account deactivated: ${userId}`);
      return { success: true };
    } catch (error) {
      throw new AppError("Account deactivation failed", 500);
    }
  }
}

module.exports = new BetterAuthService();
