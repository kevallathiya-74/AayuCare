/**
 * Validation Middleware
 * Validates request data against Joi schemas
 */
const { AppError } = require("./errorHandler");

/**
 * Validate request body against schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return next(new AppError(errorMessage, 400));
    }

    // Replace body with validated value (stripped unknown fields)
    req.body = value;
    next();
  };
};

/**
 * Validate request params against schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return next(new AppError(errorMessage, 400));
    }

    req.params = value;
    next();
  };
};

/**
 * Validate request query against schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return next(new AppError(errorMessage, 400));
    }

    req.query = value;
    next();
  };
};

/**
 * Validate MongoDB ObjectId format (for backward compatibility)
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} Express middleware
 */
const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];

    // Check if it's a valid UUID (PostgreSQL format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    const objectIdRegex = /^[0-9a-f]{24}$/i;

    if (!uuidRegex.test(id) && !objectIdRegex.test(id)) {
      return next(new AppError(`Invalid ${paramName} format`, 400));
    }

    next();
  };
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
  validateObjectId,
};
