const { body, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return next(new AppError(errorMessages, 400));
    }
    next();
};

exports.validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('userType')
        .optional()
        .isIn(['user', 'hospital', 'doctor']).withMessage('Invalid user type'),

    validate,
];

exports.validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email or phone is required'),

    body('password')
        .notEmpty().withMessage('Password is required'),

    validate,
];
