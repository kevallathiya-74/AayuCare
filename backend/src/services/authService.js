const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Auth Service - Business Logic Layer
 * Handles all authentication-related business logic
 */

class AuthService {
    /**
     * Generate JWT tokens with version tracking
     */
    async generateTokens(userId, role) {
        // Validate JWT secret exists and is strong
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters');
        }

        // Get user's current token version
        const user = await User.findById(userId).select('tokenVersion');
        const tokenVersion = user ? user.tokenVersion : 0;

        const accessToken = jwt.sign(
            { id: userId, role, version: tokenVersion },
            secret,
            { expiresIn: process.env.JWT_EXPIRE || '1h' } // Reduced to 1 hour
        );

        const refreshToken = jwt.sign(
            { id: userId, role, version: tokenVersion },
            secret,
            { expiresIn: '7d' } // Reduced to 7 days
        );

        return { accessToken, refreshToken };
    }

    /**
     * Register new user
     */
    async register(userData) {
        const { userId, email, phone, role, ...rest } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ userId }, { email }, { phone }]
        });

        if (existingUser) {
            throw new AppError('User with this ID, email, or phone already exists', 400);
        }

        // Validate role-specific data
        this.validateRoleData(role, rest);

        // Create user
        const user = await User.create({
            userId,
            email,
            phone,
            role,
            ...rest,
        });

        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens(user._id, user.role);

        // Save refresh token
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        logger.info(`New ${role} registered: ${user.userId}`);

        return { user, accessToken, refreshToken };
    }

    /**
     * Login user
     */
    async login(userId, password) {
        if (!userId || !password) {
            throw new AppError('Please provide user ID and password', 400);
        }

        // Find user and include password
        const user = await User.findOne({ userId }).select('+password');

        // Check if user exists
        if (!user) {
            throw new AppError('Incorrect User ID', 401);
        }

        // Check if password is correct
        if (!(await user.comparePassword(password))) {
            throw new AppError('Incorrect Password', 401);
        }

        // Check if account is active
        if (!user.isActive) {
            throw new AppError('Your account has been deactivated', 403);
        }

        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens(user._id, user.role);
        logger.info(`[authService] Generated tokens for ${user.userId}: accessToken=${!!accessToken}, refreshToken=${!!refreshToken}`);

        // Update user without password validation
        await User.findByIdAndUpdate(
            user._id,
            {
                refreshToken: refreshToken,
                lastLogin: new Date(),
            },
            { runValidators: false }
        );

        // Remove password from response
        user.password = undefined;

        logger.info(`${user.role} logged in: ${user.userId}`);
        logger.info(`[authService] Returning: user=${!!user}, accessToken=${!!accessToken}, refreshToken=${!!refreshToken}`);

        return { user, accessToken, refreshToken };
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400);
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Generate new access token
        const { accessToken } = this.generateTokens(user._id, user.role);

        return { accessToken };
    }

    /**
     * Logout user - Invalidate all tokens by incrementing version
     */
    async logout(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Increment token version to invalidate all existing tokens
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.refreshToken = null;
        await user.save();

        logger.info(`${user.role} logged out: ${user.userId} (token version: ${user.tokenVersion})`);

        return { message: 'Logged out successfully. All sessions invalidated.' };
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const { name, email, phone, avatar, ...otherFields } = updateData;

        // Fields that can be updated
        const allowedFields = { name, email, phone, avatar };

        // Add role-specific fields
        if (user.role === 'doctor') {
            allowedFields.specialization = otherFields.specialization;
            allowedFields.qualification = otherFields.qualification;
            allowedFields.experience = otherFields.experience;
            allowedFields.consultationFee = otherFields.consultationFee;
        } else if (user.role === 'patient') {
            allowedFields.bloodGroup = otherFields.bloodGroup;
            allowedFields.address = otherFields.address;
            allowedFields.emergencyContact = otherFields.emergencyContact;
        } else if (user.role === 'admin') {
            allowedFields.department = otherFields.department;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            allowedFields,
            { new: true, runValidators: true }
        );

        logger.info(`${updatedUser.role} updated profile: ${updatedUser.userId}`);

        return updatedUser;
    }

    /**
     * Validate role-specific data
     */
    validateRoleData(role, data) {
        if (role === 'doctor') {
            if (!data.specialization || !data.qualification || 
                typeof data.experience !== 'number' || data.experience < 0 ||
                typeof data.consultationFee !== 'number' || data.consultationFee < 0) {
                throw new AppError('Doctor registration requires specialization, qualification, experience, and consultation fee', 400);
            }
        } else if (role === 'patient') {
            if (!data.dateOfBirth || !data.gender) {
                throw new AppError('Patient registration requires date of birth and gender', 400);
            }
        } else if (role === 'admin') {
            if (!data.department) {
                throw new AppError('Admin registration requires department', 400);
            }
        }
    }
}

module.exports = new AuthService();
