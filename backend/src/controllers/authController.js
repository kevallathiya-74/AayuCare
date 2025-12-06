const authService = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');

exports.register = async (req, res, next) => {
    try {
        const { user, accessToken, refreshToken } = await authService.register(req.body);

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
        const { user, accessToken, refreshToken } = await authService.login(userId, password);

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
        const { accessToken } = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({
            status: 'success',
            data: {
                token: accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
    try {
        await authService.logout(req.user.id);

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
        const user = await authService.updateProfile(req.user.id, req.body);

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
