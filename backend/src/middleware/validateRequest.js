const { AppError } = require('./errorHandler');

/**
 * Higher-order middleware function that validates the request body against a Joi schema
 * @param {import('joi').ObjectSchema} schema - Joi schema object
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        if (!schema) return next();

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true, // Remove unknown keys
        });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            const err = new AppError(errorMessage, 400);
            err.isJoi = true;
            return next(err);
        }

        // Overwrite body with validated & stripped data
        req.body = value;
        next();
    };
};

module.exports = validateRequest;
