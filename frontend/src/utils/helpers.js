/**
 * AayuCare - Utility Functions & Constants
 *
 * Common helper functions used throughout the app.
 */

import { Dimensions, Platform } from "react-native";

import { theme } from "../theme";

// Device dimensions
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");


// Indian-specific formatting

/**
 * Format currency in Indian Rupees
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Show ₹ symbol (default: true)
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount))
    return showSymbol ? "₹0" : "0";
  const formatted = Math.abs(amount).toFixed(2);
  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format phone number in Indian format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Validate Aadhaar number
 * @param {string} aadhaar - Aadhaar number
 * @returns {boolean} Is valid
 */
const isValidAadhaar = (aadhaar) => {
  const cleaned = aadhaar.replace(/\D/g, "");
  return /^\d{12}$/.test(cleaned);
};

// Date & Time utilities

/**
 * Format date in Indian format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format time in 12-hour format (Indian preference)
 * @param {Date|string} date - Date/time to format
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const paddedHours = String(hours).padStart(2, "0");
  return `${paddedHours}:${minutes} ${ampm}`;
};

/**
 * Convert 24-hour time string to 12-hour format with AM/PM
 * @param {string} time24 - Time in 24-hour format (e.g., '14:00', '09:30')
 * @returns {string} Time in 12-hour format (e.g., '2:00 PM', '9:30 AM')
 */
export const convertTo12Hour = (time24) => {
  if (!time24) return "";
  const [hours24, minutes] = time24.split(":");
  let hours = parseInt(hours24, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const paddedHours = String(hours).padStart(2, "0");
  return `${paddedHours}:${minutes} ${ampm}`;
};

/**
 * Convert 12-hour time string with AM/PM to 24-hour format
 * @param {string} time12 - Time in 12-hour format (e.g., '2:00 PM', '9:30 AM', '10:30 AM')
 * @returns {string} Time in 24-hour format (e.g., '14:00', '09:30', '10:30')
 */
export const convertTo24Hour = (time12) => {
  if (!time12) return "";

  // Match time format like "10:30 AM" or "2:00 PM"
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12; // Return as-is if format doesn't match

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  // Convert to 24-hour format
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  // Ensure hours are zero-padded
  const hours24 = String(hours).padStart(2, "0");
  return `${hours24}:${minutes}`;
};

/**
 * Format date and time together
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target - now;
  const diffMins = Math.floor(Math.abs(diffMs) / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return diffMs < 0 ? `${diffMins} mins ago` : `in ${diffMins} mins`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return diffMs < 0 ? `${diffHours} hours ago` : `in ${diffHours} hours`;

  const diffDays = Math.floor(diffHours / 24);
  return diffMs < 0 ? `${diffDays} days ago` : `in ${diffDays} days`;
};

// Health metric utilities

/**
 * Get BMI category
 * @param {number} bmi - Body Mass Index
 * @returns {string} Category (Underweight, Normal, Overweight, Obese)
 */
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

/**
 * Get blood pressure category
 * @param {number} systolic - Systolic pressure
 * @param {number} diastolic - Diastolic pressure
 * @returns {string} Category (Normal, Elevated, High)
 */
const getBPCategory = (systolic, diastolic) => {
  if (systolic < 120 && diastolic < 80) return "Normal";
  if (systolic < 130 && diastolic < 80) return "Elevated";
  if (systolic < 140 || diastolic < 90) return "High (Stage 1)";
  return "High (Stage 2)";
};

/**
 * Get heart rate category
 * @param {number} heartRate - Heart rate in bpm
 * @returns {string} Category (Low, Normal, High)
 */
const getHeartRateCategory = (heartRate) => {
  if (heartRate < 60) return "Low";
  if (heartRate <= 100) return "Normal";
  return "High";
};

/**
 * Get color associated with a status string
 * @param {string} status - The status string
 * @param {string} context - The context (appointment, payment, etc.)
 * @returns {string} Hex color code
 */
export const getStatusColor = (status, _context = "appointment") => {
  if (!status) return theme.colors.grays.gray500;

  const s = status.toLowerCase();

  // Generic success/active states
  if (
    [
      "completed",
      "confirmed",
      "ready",
      "dispensed",
      "paid",
      "active",
      "success",
    ].includes(s)
  ) {
    return theme.colors.success.main;
  }

  // Generic warning/pending states
  if (
    ["pending", "processing", "scheduled", "preparing", "ongoing"].includes(s)
  ) {
    return theme.colors.warning.main;
  }

  // Generic error/cancelled states
  if (
    [
      "cancelled",
      "failed",
      "refunded",
      "no_show",
      "inactive",
      "critical",
    ].includes(s)
  ) {
    return theme.colors.error.main;
  }

  // Default fallback
  return theme.colors.primary;
};

/**
 * Get full style object (text & background colors) for a status badge
 * @param {string} status - The status string
 * @returns {Object} { color, backgroundColor } style object
 */
export const getStatusStyle = (status) => {
  if (!status)
    return {
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.grays.gray200,
    };

  const s = status.toLowerCase();

  if (
    [
      "completed",
      "confirmed",
      "ready",
      "dispensed",
      "paid",
      "active",
      "success",
    ].includes(s)
  ) {
    return {
      color: theme.colors.success.dark,
      backgroundColor: theme.colors.success.background,
    };
  }

  if (
    ["pending", "processing", "scheduled", "preparing", "ongoing"].includes(s)
  ) {
    return {
      color: theme.colors.warning.dark,
      backgroundColor: theme.colors.warning.background,
    };
  }

  if (
    [
      "cancelled",
      "failed",
      "refunded",
      "no_show",
      "inactive",
      "critical",
    ].includes(s)
  ) {
    return {
      color: theme.colors.error.dark,
      backgroundColor: theme.colors.error.background,
    };
  }

  if (["in_progress", "started", "arrived"].includes(s)) {
    return {
      color: theme.colors.info.dark,
      backgroundColor: theme.colors.info.background,
    };
  }

  return {
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryLight + "30",
  };
};

// String utilities

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
const truncate = (str, maxLength = 50) => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "John Doe" -> "JD")
 */
export const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);
};

/**
 * Get user-friendly error message
 * @param {Error|string} error - Error object or string
 * @returns {string} User-friendly message
 */
const getErrorMessage = (error) => {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return "An unexpected error occurred. Please try again.";
};

// Platform utilities

/**
 * Trigger haptic feedback (vibration)
 * @param {string} type - Type of feedback ('light', 'medium', 'heavy')
 */

const hapticFeedback = (_type = "light") => {
  if (Platform.OS === "ios") {
    // iOS haptic feedback would go here
    // Requires expo-haptics
  }
};

// Function utilities

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Array utilities

/**
 * Group array items by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Sort array by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export const sortBy = (array, key, order = "asc") => {
  return [...array].sort((a, b) => {
    if (order === "asc") {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

export default {
  formatCurrency,
  formatPhoneNumber,
  isValidAadhaar,
  formatDate,
  formatTime,
  formatDateTime,
  getRelativeTime,
  getBMICategory,
  getBPCategory,
  getHeartRateCategory,
  capitalize,
  truncate,
  getInitials,
  getErrorMessage,
  hapticFeedback,
  debounce,
  throttle,
  groupBy,
  sortBy,
  getStatusColor,
  getStatusStyle,
};
