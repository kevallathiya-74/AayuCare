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
     * Generate JWT tokens
     */
    generateTokens(userId, role) {
        const accessToken = jwt.sign(
            { id: userId, role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        const refreshToken = jwt.sign(
            { id: userId, role },
            process.env.JWT_SECRET,
            { expiresIn: '90d' }
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
        const { accessToken, refreshToken } = this.generateTokens(user._id, user.role);

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
        const { accessToken, refreshToken } = this.generateTokens(user._id, user.role);

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
     * Logout user
     */
    async logout(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        user.refreshToken = null;
        await user.save();

        logger.info(`${user.role} logged out: ${user.userId}`);
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
            if (!data.specialization || !data.qualification || !data.experience || !data.consultationFee) {
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
