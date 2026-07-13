/**
 * AayuCare - Error Handler Utility
 *
 * Centralized error handling with user-friendly messages
 * Provides consistent error display across the app
 * Integrated with Sentry
 */

import { Alert, Platform } from "react-native";
import { captureException } from "../config/sentry";

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
  NETWORK: "NETWORK",
  AUTHENTICATION: "AUTHENTICATION",
  VALIDATION: "VALIDATION",
  SERVER: "SERVER",
  NOT_FOUND: "NOT_FOUND",
  PERMISSION: "PERMISSION",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN",
};

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your internet connection.",
  AUTHENTICATION: "Authentication failed. Please login again.",
  VALIDATION: "Please check your input and try again.",
  SERVER: "Server error. Please try again later.",
  NOT_FOUND: "The requested resource was not found.",
  PERMISSION: "You do not have permission to perform this action.",
  TIMEOUT: "Request timed out. Please try again.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
};

const isTechnicalMessage = (message = "") => {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("sql") ||
    text.includes("sequelize") ||
    text.includes("mongodb") ||
    text.includes("stack") ||
    text.includes("exception") ||
    text.includes("syntax error") ||
    text.includes("trace") ||
    text.includes("internal server error") ||
    text.includes("validation failed") ||
    text.includes("cannot read properties")
  );
};

const sanitizeServerMessage = (message = "") => {
  const trimmed = String(message || "").trim();
  if (!trimmed) return "";
  return isTechnicalMessage(trimmed) ? "" : trimmed;
};

const extractServerMessage = (data) => {
  if (!data) return "";

  const candidates = [data.message, data.error, data.details];

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const firstError = data.errors[0];
    candidates.push(
      typeof firstError === "string"
        ? firstError
        : firstError?.message || firstError?.msg
    );
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const safe = sanitizeServerMessage(candidate);
      if (safe) return safe;
    }
  }

  return "";
};

const mapStatusToMessage = (status) => {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION;
    case 401:
      return ERROR_MESSAGES.AUTHENTICATION;
    case 403:
      return ERROR_MESSAGES.PERMISSION;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 408:
      return ERROR_MESSAGES.TIMEOUT;
    case 500:
    case 502:
    case 503:
      return ERROR_MESSAGES.SERVER;
    default:
      return ERROR_MESSAGES.UNKNOWN;
  }
};

/**
 * Parse error object and extract user-friendly message
 * @param {Error|string|Object} error - Error to parse
 * @returns {string} User-friendly error message
 */
export const parseError = (error) => {
  // Handle string errors
  if (typeof error === "string") {
    const safe = sanitizeServerMessage(error);
    return safe || ERROR_MESSAGES.UNKNOWN;
  }

  // Handle axios/fetch errors with response
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 403) {
      const url = error.config?.url || "unknown";
      const method = error.config?.method?.toUpperCase() || "GET";
      let currentRole = "unknown";
      try {
        const store = require("../store/store").default;
        currentRole = store?.getState?.()?.auth?.user?.role || "unknown";
      } catch {
        // Safe ignore if store is not initialized or in a non-UI test runtime environment
      }

      logError(
        {
          message: "Permission Denied (403)",
          url,
          method,
          currentRole,
        },
        "API.parseError"
      );

      return (
        `Permission Denied (403)\n` +
        `Action: ${method} ${url}\n` +
        `Current Role: ${currentRole}\n` +
        `Details: Incorrect endpoint selected or insufficient role privileges.`
      );
    }

    const code = data?.code || data?.errorCode;
    if (code === "AUTH_EXPIRED" || code === "UNAUTHORIZED") {
      return ERROR_MESSAGES.AUTHENTICATION;
    }

    const serverMessage = extractServerMessage(data);
    if (serverMessage) {
      return serverMessage;
    }

    return mapStatusToMessage(status);
  }

  // Handle network errors
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (message.includes("network") || message.includes("connection")) {
      return ERROR_MESSAGES.NETWORK;
    }
    if (message.includes("timeout")) {
      return ERROR_MESSAGES.TIMEOUT;
    }
    if (
      message.includes("unauthorized") ||
      message.includes("unauthenticated")
    ) {
      return ERROR_MESSAGES.AUTHENTICATION;
    }
    if (isTechnicalMessage(error.message)) {
      return ERROR_MESSAGES.UNKNOWN;
    }
    const safe = sanitizeServerMessage(error.message);
    return safe || ERROR_MESSAGES.UNKNOWN;
  }

  // Fallback
  return ERROR_MESSAGES.UNKNOWN;
};

/**
 * Alias for parseError to fulfill requirements
 */
export const getHumanReadableError = parseError;

let activeDialogTrigger = null;

/**
 * Register global dialog handler (for UI custom dialog redirection)
 * @param {Function} triggerFn - Trigger function from Dialog provider
 */
export const registerDialogTrigger = (triggerFn) => {
  activeDialogTrigger = triggerFn;
};

/**
 * Show error alert to user
 * @param {Error|string} error - Error to display
 * @param {string} title - Alert title
 * @param {Function} onDismiss - Callback when dismissed
 */
export const showError = (error, title = "Error", onDismiss) => {
  const message = parseError(error);

  if (activeDialogTrigger) {
    activeDialogTrigger({
      type: "error",
      title,
      message,
      buttons: [
        {
          text: "OK",
          onPress: onDismiss,
        },
      ],
    });
    return;
  }

  Alert.alert(
    title,
    message,
    [
      {
        text: "OK",
        onPress: onDismiss,
      },
    ],
    { cancelable: false }
  );
};

/**
 * Show success message to user
 * @param {string} message - Success message
 * @param {string} title - Optional custom title
 * @param {Function} onDismiss - Optional callback when dismissed
 */
export const showSuccess = (message, title = "Success", onDismiss) => {
  if (activeDialogTrigger) {
    activeDialogTrigger({
      type: "success",
      title,
      message,
      buttons: [
        {
          text: "OK",
          onPress: onDismiss,
        },
      ],
    });
    return;
  }

  Alert.alert(
    title,
    message,
    [
      {
        text: "OK",
        onPress: onDismiss,
      },
    ],
    { cancelable: false }
  );
};

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 * @param {string} title - Optional custom title
 */
export const showConfirmation = (
  message,
  onConfirm,
  onCancel,
  title = "Confirm",
  icon = "help-circle"
) => {
  if (activeDialogTrigger) {
    activeDialogTrigger({
      type: "confirm",
      title,
      message,
      icon,
      buttons: [
        {
          text: "Cancel",
          onPress: onCancel,
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: onConfirm,
          style: "default",
        },
      ],
    });
    return;
  }

  Alert.alert(
    title,
    message,
    [
      {
        text: "Cancel",
        onPress: onCancel,
        style: "cancel",
      },
      {
        text: "Confirm",
        onPress: onConfirm,
      },
    ],
    { cancelable: false }
  );
};

/**
 * Determine error severity for Sentry
 * @param {Error|string} error - The error to categorize
 * @returns {string} Sentry severity level
 */
const getSeverity = (error) => {
  const message = typeof error === "string" ? error : error?.message || "";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("network") || lowerMessage.includes("timeout")) {
    return "warning";
  }
  if (
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("forbidden")
  ) {
    return "info";
  }
  if (lowerMessage.includes("server") || lowerMessage.includes("500")) {
    return "error";
  }
  if (lowerMessage.includes("critical") || lowerMessage.includes("fatal")) {
    return "fatal";
  }
  return "error";
};

/**
 * Log error for debugging and send to error tracking service
 * @param {Error|string} error - The error to log
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = "") => {
  // Always log to console for debugging in development
  if (__DEV__) {
    console.error(`[${context}] Error:`, error);
  }

  // Send to Sentry (handles both Expo Go and native builds)
  if (!__DEV__) {
    const severity = getSeverity(error);
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        tags: { context },
        level: severity,
        extra: {
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        },
      }
    );
  }
};

/**
 * Validate required fields
 * @param {Object} fields - Object with field names and values
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateRequiredFields = (fields) => {
  const errors = {};
  let isValid = true;

  Object.keys(fields).forEach((key) => {
    const value = fields[key];
    if (!value || (typeof value === "string" && !value.trim())) {
      errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Indian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  // Indian phone: 10 digits, optionally with +91
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};

/**
 * Handle async operation with error handling
 * @param {Function} asyncFn - Async function to execute
 * @param {Function} setLoading - Loading state setter
 * @param {Function} setError - Error state setter (optional)
 * @param {string} errorContext - Context for error logging
 */
export const handleAsync = async (
  asyncFn,
  setLoading,
  setError = null,
  errorContext = ""
) => {
  try {
    if (setLoading) setLoading(true);
    const result = await asyncFn();
    if (setLoading) setLoading(false);
    return result;
  } catch (error) {
    if (setLoading) setLoading(false);
    logError(error, errorContext);
    if (setError) {
      setError(parseError(error));
    }
    throw error;
  }
};

export const toSafeError = (error) => {
  return new Error(parseError(error));
};

/**
 * Default export with all error handler utilities
 */
export default {
  ERROR_TYPES,
  ERROR_MESSAGES,
  parseError,
  getHumanReadableError,
  showError,
  showSuccess,
  showConfirmation,
  registerDialogTrigger,
  logError,
  validateRequiredFields,
  validateEmail,
  validatePhone,
  handleAsync,
  toSafeError,
};
