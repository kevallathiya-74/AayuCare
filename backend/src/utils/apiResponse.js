/**
 * Centralized API Response Helpers
 * Follows Context7 standard response envelope structure.
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Success message
 * @param {Object|Array} data - Payload data
 */
const sendSuccess = (res, status, message, data = {}) => {
  return res.status(status).json({
    success: true,
    status: "success",
    message,
    data,
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Application specific error code
 * @param {Array} errors - Detailed validation/execution errors
 */
const sendError = (res, status, message, code = "ERROR", errors = []) => {
  return res.status(status).json({
    success: false,
    status: "error",
    message,
    code,
    errors,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
