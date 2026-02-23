const logger = require('../utils/logger');

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // MongoDB CastError (e.g., invalid ObjectId in URL param)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`,
        });
    }

    // PostgreSQL unique constraint violation
    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            message: 'Resource already exists (duplicate entry)',
        });
    }

    // PostgreSQL foreign key constraint violation
    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            message: 'Referenced resource does not exist',
        });
    }

    // PostgreSQL not-null constraint violation
    if (err.code === '23502') {
        return res.status(400).json({
            success: false,
            message: `Missing required field: ${err.column || 'unknown'}`,
        });
    }

    // Handle specific well-known error types before env branching
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please log in again.',
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired. Please log in again.',
        });
    }
    if (err.isJoi || (err.name === 'ValidationError' && !err.errors)) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // Mongoose ValidationError with per-field details
    if (err.name === 'ValidationError' && err.errors) {
        const fields = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: fields,
        });
    }

    if (process.env.NODE_ENV === 'development') {
        logger.error('Error:', {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode,
        });

        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        // Production - don't expose stack traces or internal error details
        logger.error('Error:', {
            message: err.message,
            statusCode: err.statusCode,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });

        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            // Don't leak error details
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!',
            });
        }
    }
};

module.exports = { AppError, errorHandler };
