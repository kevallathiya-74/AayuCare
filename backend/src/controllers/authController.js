const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });

    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '90d',
    });

    return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, phone, password, userType } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return next(new AppError('User with this email or phone already exists', 400));
        }

        // Create user
        const user = await User.create({
            name,
            email,
            phone,
            password,
            userType: userType || 'user',
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        logger.info(`New user registered: ${user.email}`);

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

exports.login = async (req, res, next) => {
    try {
        const { email, password, userType } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        // Find user and include password
        const user = await User.findOne({
            $or: [{ email }, { phone: email }],
            userType: userType || 'user'
        }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError('Invalid credentials', 401));
        }

        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated', 403));
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Remove password from response
        user.password = undefined;

        logger.info(`User logged in: ${user.email}`);

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
        const { accessToken } = generateTokens(user._id);

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

exports.logout = async (req, res, next) => {
    try {
        // Clear refresh token
        req.user.refreshToken = null;
        await req.user.save();

        logger.info(`User logged out: ${req.user.email}`);

        res.status(200).json({
            status: 'success',
            message: 'Logout successful',
        });
    } catch (error) {
        next(error);
    }
};

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
