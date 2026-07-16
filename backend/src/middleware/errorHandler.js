const logger = require("../utils/logger");

const mapErrorCode = (statusCode) => {
  if (statusCode === 400) return "VALIDATION_ERROR";
  if (statusCode === 401) return "UNAUTHORIZED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 409) return "CONFLICT";
  if (statusCode >= 500) return "INTERNAL_SERVER_ERROR";
  return "REQUEST_FAILED";
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // PostgreSQL unique constraint violation
  if (err.code === "23505") {
    return res.status(409).json({ success: false, message: "Resource already exists (duplicate entry)", code: "CONFLICT" });
  }

  // PostgreSQL foreign key constraint violation
  if (err.code === "23503") {
    return res.status(400).json({ success: false, message: "Referenced resource does not exist", code: "VALIDATION_ERROR" });
  }

  // PostgreSQL not-null constraint violation
  if (err.code === "23502") {
    return res.status(400).json({ success: false, message: `Missing required field: ${err.column || "unknown"}`, code: "VALIDATION_ERROR" });
  }

  // PostgreSQL check constraint violation
  if (err.code === "23514") {
    return res.status(400).json({ success: false, message: `Invalid value: ${err.constraint || "data validation failed"}`, code: "VALIDATION_ERROR" });
  }

  // PostgreSQL invalid value for enum / data type
  if (err.code === "22P02") {
    return res.status(400).json({ success: false, message: "Invalid data format in request", code: "VALIDATION_ERROR" });
  }

  // Handle specific well-known error types before env branching
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token. Please log in again.", code: "UNAUTHORIZED" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired. Please log in again.", code: "UNAUTHORIZED" });
  }
  if (err.isJoi) {
    return res.status(400).json({ success: false, message: err.message, code: "VALIDATION_ERROR" });
  }

  if (process.env.NODE_ENV === "development") {
    logger.error("Error:", {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
    });

    const includeStack = process.env.EXPOSE_ERROR_STACK === "true";
    const details = includeStack
      ? [{ field: null, message: err.stack }]
      : undefined;
      
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: mapErrorCode(err.statusCode),
      errors: details || []
    });
  } else {
    // Production - don't expose stack traces or internal error details
    logger.error("Error:", {
      message: err.message,
      statusCode: err.statusCode,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });

    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: mapErrorCode(err.statusCode)
      });
    } else {
      // Don't leak error details
      return res.status(500).json({ success: false, message: "Something went wrong!", code: "INTERNAL_SERVER_ERROR" });
    }
  }
};

module.exports = { AppError, errorHandler };
