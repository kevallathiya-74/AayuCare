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
