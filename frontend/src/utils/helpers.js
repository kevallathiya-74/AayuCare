/**
 * AayuCare - Utility Functions & Constants
 * 
 * Common helper functions used throughout the app.
 */

import { Dimensions, Platform } from 'react-native';
import { theme } from '../theme';

// Device dimensions
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// Check if tablet
export const isTablet = () => {
  const aspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
  return Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
};

// Indian-specific formatting

/**
 * Format currency in Indian Rupees
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Show ₹ symbol
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, showSymbol = true) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return showSymbol ? formatted : formatted.replace('₹', '').trim();
};

/**
 * Format phone number (Indian format)
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Indian mobile: +91 XXXXX XXXXX
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

/**
 * Validate Indian phone number
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid
 */
export const isValidPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned) || /^91[6-9]\d{9}$/.test(cleaned);
};

/**
 * Validate email
 * @param {string} email - Email address
 * @returns {boolean} Is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Aadhaar number (optional)
 * @param {string} aadhaar - Aadhaar number
 * @returns {boolean} Is valid format
 */
export const isValidAadhaar = (aadhaar) => {
  const cleaned = aadhaar.replace(/\D/g, '');
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
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
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
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Convert 24-hour time string to 12-hour format with AM/PM
 * @param {string} time24 - Time in 24-hour format (e.g., '14:00', '09:30')
 * @returns {string} Time in 12-hour format (e.g., '2:00 PM', '9:30 AM')
 */
export const convert24To12Hour = (time24) => {
  if (!time24 || typeof time24 !== 'string') return time24;
  
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  
  if (isNaN(hours)) return time24;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  
  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Format date and time together
 * @param {Date|string} date - Date/time to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time
 */
export const getRelativeTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};

// Health data utilities

/**
 * Get BMI category
 * @param {number} bmi - BMI value
 * @returns {object} Category and color
 */
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return { category: 'Underweight', color: theme.colors.warning.main };
  if (bmi < 25) return { category: 'Normal', color: theme.colors.success.main };
  if (bmi < 30) return { category: 'Overweight', color: theme.colors.warning.main };
  return { category: 'Obese', color: theme.colors.error.main };
};

/**
 * Get blood pressure category
 * @param {number} systolic - Systolic pressure
 * @param {number} diastolic - Diastolic pressure
 * @returns {object} Category and color
 */
export const getBPCategory = (systolic, diastolic) => {
  if (systolic < 120 && diastolic < 80) {
    return { category: 'Normal', color: theme.colors.success.main };
  }
  if (systolic < 130 && diastolic < 80) {
    return { category: 'Elevated', color: theme.colors.warning.main };
  }
  if (systolic < 140 || diastolic < 90) {
    return { category: 'High (Stage 1)', color: theme.colors.warning.dark };
  }
  return { category: 'High (Stage 2)', color: theme.colors.error.main };
};

/**
 * Get heart rate category
 * @param {number} bpm - Beats per minute
 * @returns {object} Category and color
 */
export const getHeartRateCategory = (bpm) => {
  if (bpm < 60) return { category: 'Low', color: theme.colors.info.main };
  if (bpm <= 100) return { category: 'Normal', color: theme.colors.success.main };
  return { category: 'High', color: theme.colors.error.main };
};

// String utilities

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncate = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Error handling

/**
 * Get user-friendly error message
 * @param {Error|string} error - Error object or message
 * @returns {string} User-friendly message
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  if (error.response) {
    // API error
    return error.response.data?.message || 'Something went wrong. Please try again.';
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Vibration/Haptic feedback

/**
 * Trigger haptic feedback (if available)
 * @param {string} type - Feedback type
 */
export const hapticFeedback = (type = 'light') => {
  // Note: In production, use expo-haptics
  // For now, this is a placeholder
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // Vibration.vibrate(type === 'light' ? 10 : 50);
  }
};

// Debounce & Throttle

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return (...args) => {
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
export const groupBy = (array, key) => {
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
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

export default {
  formatCurrency,
  formatPhoneNumber,
  isValidPhoneNumber,
  isValidEmail,
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
};

