const logger = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');

const mapErrorCode = (statusCode) => {
    if (statusCode === 400) return 'VALIDATION_ERROR';
    if (statusCode === 401) return 'UNAUTHORIZED';
    if (statusCode === 403) return 'FORBIDDEN';
    if (statusCode === 404) return 'NOT_FOUND';
    if (statusCode === 409) return 'CONFLICT';
    if (statusCode >= 500) return 'INTERNAL_SERVER_ERROR';
    return 'REQUEST_FAILED';
};

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



    // PostgreSQL unique constraint violation
    if (err.code === '23505') {
        return sendError(res, req, 'Resource already exists (duplicate entry)', 409, 'CONFLICT');
    }

    // PostgreSQL foreign key constraint violation
    if (err.code === '23503') {
        return sendError(res, req, 'Referenced resource does not exist', 400, 'VALIDATION_ERROR');
    }

    // PostgreSQL not-null constraint violation
    if (err.code === '23502') {
        return sendError(res, req, `Missing required field: ${err.column || 'unknown'}`, 400, 'VALIDATION_ERROR');
    }

    // PostgreSQL check constraint violation
    if (err.code === '23514') {
        return sendError(res, req, `Invalid value: ${err.constraint || 'data validation failed'}`, 400, 'VALIDATION_ERROR');
    }

    // PostgreSQL invalid value for enum / data type
    if (err.code === '22P02') {
        return sendError(res, req, 'Invalid data format in request', 400, 'VALIDATION_ERROR');
    }

    // Handle specific well-known error types before env branching
    if (err.name === 'JsonWebTokenError') {
        return sendError(res, req, 'Invalid token. Please log in again.', 401, 'UNAUTHORIZED');
    }
    if (err.name === 'TokenExpiredError') {
        return sendError(res, req, 'Token expired. Please log in again.', 401, 'UNAUTHORIZED');
    }
    if (err.isJoi) {
        return sendError(res, req, err.message, 400, 'VALIDATION_ERROR');
    }

    if (process.env.NODE_ENV === 'development') {
        logger.error('Error:', {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode,
        });

        const includeStack = process.env.EXPOSE_ERROR_STACK === 'true';
        const details = includeStack ? [{ field: null, message: err.stack }] : undefined;
        return sendError(res, req, err.message, err.statusCode, mapErrorCode(err.statusCode), details);
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
            return sendError(res, req, err.message, err.statusCode, mapErrorCode(err.statusCode));
        } else {
            // Don't leak error details
            return sendError(res, req, 'Something went wrong!', 500, 'INTERNAL_SERVER_ERROR');
        }
    }
};

module.exports = { AppError, errorHandler };
