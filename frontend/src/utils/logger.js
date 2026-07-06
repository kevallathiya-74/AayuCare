/**
 * Logger Utility
 * Conditional logging that only works in development mode
 * Prevents console statements in production builds
 */

const isDev = __DEV__;

const logger = {
  /**
   * Debug level logging - only in development
   * @param {string} context - Context/component name
   * @param {*} message - Message to log
   * @param {*} data - Optional data to log
   */
  debug: (context, message, data = null) => {
    if (isDev) {
      if (data) {
        console.warn(`[${context}] ${message}`, data);
      } else {
        console.warn(`[${context}] ${message}`);
      }
    }
  },

  /**
   * Info level logging - only in development
   * @param {string} context - Context/component name
   * @param {*} message - Message to log
   * @param {*} data - Optional data to log
   */
  info: (context, message, data = null) => {
    if (isDev) {
      if (data) {
        console.warn(`[${context}] ℹ️ ${message}`, data);
      } else {
        console.warn(`[${context}] ℹ️ ${message}`);
      }
    }
  },

  /**
   * Warning level logging - works in all environments
   * @param {string} context - Context/component name
   * @param {*} message - Message to log
   * @param {*} data - Optional data to log
   */
  warn: (context, message, data = null) => {
    if (data) {
      console.warn(`[${context}] ⚠️ ${message}`, data);
    } else {
      console.warn(`[${context}] ⚠️ ${message}`);
    }
  },

  /**
   * Error level logging - works in all environments
   * @param {string} context - Context/component name
   * @param {*} message - Message to log
   * @param {*} error - Error object or data
   */
  error: (context, message, error = null) => {
    if (error) {
      console.error(`[${context}] ❌ ${message}`, error);
    } else {
      console.error(`[${context}] ❌ ${message}`);
    }
  },

  /**
   * Success logging - only in development
   * @param {string} context - Context/component name
   * @param {*} message - Message to log
   */
  success: (context, message) => {
    if (isDev) {
      console.warn(`[${context}] ✅ ${message}`);
    }
  },

  /**
   * API request logging - only in development
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint
   * @param {*} data - Request data
   */
  apiRequest: (method, url, data = null) => {
    if (isDev) {
      console.warn(`[API] 🔄 ${method} ${url}`, data || "");
    }
  },

  /**
   * API response logging - only in development
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint
   * @param {*} response - Response data
   */
  apiResponse: (method, url, response) => {
    if (isDev) {
      console.warn(`[API] ✅ ${method} ${url}`, response);
    }
  },

  /**
   * API error logging - works in all environments
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint
   * @param {*} error - Error object
   */
  apiError: (method, url, error) => {
    console.error(`[API] ❌ ${method} ${url}`, error);
  },
};

export default logger;

