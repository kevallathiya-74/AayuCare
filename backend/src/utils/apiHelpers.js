/**
 * API Response Utilities
 * Consistent response formatting and pagination helpers
 */

/**
 * Pagination helper - calculates pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const getPaginationMeta = (total, page, limit) => {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const totalPages = Math.ceil(total / itemsPerPage);

  return {
    total,
    page: currentPage,
    limit: itemsPerPage,
    pages: totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

/**
 * Get skip value for pagination
 * @param {number} page - Current page (1-based)
 * @param {number} limit - Items per page
 * @returns {number} Skip value for MongoDB
 */
const getSkip = (page, limit) => {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return (currentPage - 1) * itemsPerPage;
};

/**
 * Success response helper
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated success response helper
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Optional success message
 */
const sendPaginatedSuccess = (res, data, pagination, message = null) => {
  const response = {
    success: true,
    data,
    pagination,
  };

  if (message) {
    response.message = message;
  }

  return res.status(200).json(response);
};

/**
 * Error response helper
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Optional error details (development only)
 */
const sendError = (res, message, statusCode = 500, details = null) => {
  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === "development" && details) {
    response.error = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Sanitize search query for regex
 * Prevents regex injection attacks
 * @param {string} query - Search query
 * @returns {string} Sanitized query
 */
const sanitizeRegex = (query) => {
  if (!query || typeof query !== "string") {
    return "";
  }
  return query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Build date range filter
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @param {string} field - Field name for the date
 * @returns {Object} MongoDB date filter
 */
const buildDateRangeFilter = (startDate, endDate, field = "createdAt") => {
  const filter = {};

  if (startDate || endDate) {
    filter[field] = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter[field].$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }

  return filter;
};

/**
 * Get today's date range filter
 * @param {string} field - Field name for the date
 * @returns {Object} MongoDB date filter for today
 */
const getTodayFilter = (field = "createdAt") => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    [field]: {
      $gte: today,
      $lt: tomorrow,
    },
  };
};

module.exports = {
  getPaginationMeta,
  getSkip,
  sendSuccess,
  sendPaginatedSuccess,
  sendError,
  sanitizeRegex,
  buildDateRangeFilter,
  getTodayFilter,
};
