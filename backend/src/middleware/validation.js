/**
 * Validation Middleware
 * Validates request data against Joi schemas
 */
const { AppError } = require("./errorHandler");

const humanizeField = (path = "field") => {
  return String(path)
    .replace(/["']/g, "")
    .replace(/[_\.]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatJoiDetail = (detail = {}) => {
  const field = humanizeField(detail?.path?.join(" ") || detail?.context?.key || "field");
  const type = detail?.type || "";

  if (type === "any.required") return `${field} is required`;
  if (type === "string.empty") return `${field} is required`;
  if (type === "string.email") return `Please enter a valid email address`;
  if (type === "string.min") return `${field} is too short`;
  if (type === "string.max") return `${field} is too long`;
  if (type === "number.base") return `${field} must be a valid number`;
  if (type === "date.base") return `${field} must be a valid date`;
  if (type === "any.only") return `${field} contains an invalid value`;
  if (type === "object.unknown") return `${field} is not allowed`;

  return `${field} is invalid`;
};

const formatValidationError = (error) => {
  const details = error?.details || [];
  if (!Array.isArray(details) || details.length === 0) {
    return "Request validation failed";
  }

  return details.map(formatJoiDetail).join(", ");
};

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
      const errorMessage = formatValidationError(error);
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
      const errorMessage = formatValidationError(error);
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
      const errorMessage = formatValidationError(error);
      return next(new AppError(errorMessage, 400));
    }

    req.query = value;
    next();
  };
};

/**
 * Validate ID format (handles UUID and legacy formats for backward compatibility)
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} Express middleware
 */
const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];

    // Check if it's a valid UUID (PostgreSQL format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Check if it's a legacy ObjectId (24 hex characters for backward compatibility)
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
