const logger = require("../utils/logger");
const { sendError } = require("../utils/apiResponse");

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
    return sendError(
      res,
      409,
      "Resource already exists (duplicate entry)",
      "CONFLICT",
    );
  }

  // PostgreSQL foreign key constraint violation
  if (err.code === "23503") {
    return sendError(
      res,
      400,
      "Referenced resource does not exist",
      "VALIDATION_ERROR",
    );
  }

  // PostgreSQL not-null constraint violation
  if (err.code === "23502") {
    return sendError(
      res,
      400,
      `Missing required field: ${err.column || "unknown"}`,
      "VALIDATION_ERROR",
    );
  }

  // PostgreSQL check constraint violation
  if (err.code === "23514") {
    return sendError(
      res,
      400,
      `Invalid value: ${err.constraint || "data validation failed"}`,
      "VALIDATION_ERROR",
    );
  }

  // PostgreSQL invalid value for enum / data type
  if (err.code === "22P02") {
    return sendError(
      res,
      400,
      "Invalid data format in request",
      "VALIDATION_ERROR",
    );
  }

  // Handle specific well-known error types before env branching
  if (err.name === "JsonWebTokenError") {
    return sendError(
      res,
      401,
      "Invalid token. Please log in again.",
      "UNAUTHORIZED",
    );
  }
  if (err.name === "TokenExpiredError") {
    return sendError(
      res,
      401,
      "Token expired. Please log in again.",
      "UNAUTHORIZED",
    );
  }
  if (err.isJoi) {
    return sendError(res, 400, err.message, "VALIDATION_ERROR");
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
    return sendError(
      res,
      err.statusCode,
      err.message,
      mapErrorCode(err.statusCode),
      details || [],
    );
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
      return sendError(
        res,
        err.statusCode,
        err.message,
        mapErrorCode(err.statusCode),
      );
    } else {
      // Don't leak error details
      return sendError(
        res,
        500,
        "Something went wrong!",
        "INTERNAL_SERVER_ERROR",
      );
    }
  }
};

module.exports = { AppError, errorHandler };
