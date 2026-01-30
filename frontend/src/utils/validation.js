/**
 * Common Validation Utilities
 * Reduces duplicate validation code across the app
 */

/**
 * Email validation
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone number validation (10 digits)
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ''));
};

/**
 * Password strength validation
 */
