const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const generateTokens = (userId, role) => {
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
};

/**
 * @desc    Register new user (Admin, Doctor, or Patient)
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
    try {
        const { userId, name, email, phone, password, role, ...roleSpecificData } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ userId }, { email }, { phone }]
        });

        if (existingUser) {
            return next(new AppError('User with this ID, email, or phone already exists', 400));
        }

        // Validate role-specific data
        if (role === 'doctor') {
            if (!roleSpecificData.specialization || !roleSpecificData.qualification ||
                !roleSpecificData.experience || !roleSpecificData.consultationFee) {
                return next(new AppError('Doctor registration requires specialization, qualification, experience, and consultation fee', 400));
            }
        } else if (role === 'patient') {
            if (!roleSpecificData.dateOfBirth || !roleSpecificData.gender) {
                return next(new AppError('Patient registration requires date of birth and gender', 400));
            }
        } else if (role === 'admin') {
            if (!roleSpecificData.department) {
                return next(new AppError('Admin registration requires department', 400));
            }
        }

        // Create user
        const user = await User.create({
            userId,
            name,
            email,
            phone,
            password,
            role,
            ...roleSpecificData,
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id, user.role);

        // Save refresh token
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        logger.info(`New ${role} registered: ${user.userId}`);

        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                user,
                token: accessToken,
                refreshToken,
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

        if (!userId || !password) {
            return next(new AppError('Please provide user ID and password', 400));
        }

        // Find user by userId and include password
        const user = await User.findOne({ userId }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError('Invalid credentials', 401));
        }

        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated. Please contact support.', 403));
        }

        // Generate tokens with role
        const { accessToken, refreshToken } = generateTokens(user._id, user.role);

        // Save refresh token and update last login
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        // Remove password from response
        user.password = undefined;

        logger.info(`${user.role} logged in: ${user.userId}`);

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user,
                token: accessToken,
                refreshToken,
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

        if (!refreshToken) {
            return next(new AppError('Refresh token is required', 400));
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return next(new AppError('Invalid refresh token', 401));
        }

        // Generate new access token
        const { accessToken } = generateTokens(user._id, user.role);

        res.status(200).json({
            status: 'success',
            data: {
                token: accessToken,
            },
        });
    } catch (error) {
        next(new AppError('Invalid or expired refresh token', 401));
    }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
    try {
        // Clear refresh token
        req.user.refreshToken = null;
        await req.user.save();

        logger.info(`${req.user.role} logged out: ${req.user.userId}`);

        res.status(200).json({
            status: 'success',
            message: 'Logout successful',
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
            status: 'success',
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
        const { name, email, phone, avatar, ...otherFields } = req.body;

        // Fields that can be updated
        const allowedFields = { name, email, phone, avatar };

        // Add role-specific fields
        if (req.user.role === 'doctor') {
            allowedFields.specialization = otherFields.specialization;
            allowedFields.qualification = otherFields.qualification;
            allowedFields.experience = otherFields.experience;
            allowedFields.consultationFee = otherFields.consultationFee;
        } else if (req.user.role === 'patient') {
            allowedFields.bloodGroup = otherFields.bloodGroup;
            allowedFields.address = otherFields.address;
            allowedFields.emergencyContact = otherFields.emergencyContact;
        } else if (req.user.role === 'admin') {
            allowedFields.department = otherFields.department;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            allowedFields,
            { new: true, runValidators: true }
        );

        logger.info(`${user.role} updated profile: ${user.userId}`);

        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (error) {
        next(error);
    }
};
