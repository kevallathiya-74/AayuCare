/**
 * AayuCare - Error Handler Utility
 * 
 * Centralized error handling with user-friendly messages
 * Provides consistent error display across the app
 * Integrated with error analytics tracking and Sentry
 */

import { Alert, Platform } from 'react-native';
import { captureException } from '../config/sentry';
import { errorAnalytics } from './errorAnalytics';

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    VALIDATION: 'VALIDATION',
    SERVER: 'SERVER',
    UNKNOWN: 'UNKNOWN',
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
    // Network errors
    NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection and try again.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    
    // Authentication errors
    AUTH_INVALID_CREDENTIALS: 'Invalid User ID or Password. Please try again.',
    AUTH_SESSION_EXPIRED: 'Your session has expired. Please login again.',
    AUTH_UNAUTHORIZED: 'You are not authorized to perform this action.',
    
    // Validation errors
    VALIDATION_REQUIRED_FIELD: 'Please fill in all required fields.',
    VALIDATION_INVALID_EMAIL: 'Please enter a valid email address.',
    VALIDATION_INVALID_PHONE: 'Please enter a valid phone number.',
    VALIDATION_PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
    
    // Server errors
    SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    SERVER_MAINTENANCE: 'Server is under maintenance. Please try again later.',
    
    // Data errors
    DATA_NOT_FOUND: 'The requested data was not found.',
    DATA_FETCH_ERROR: 'Failed to load data. Please try again.',
    
    // Generic
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Parse error and return user-friendly message
 * @param {Error|string|Object} error - The error to parse
 * @returns {string} User-friendly error message
 */
export const parseError = (error) => {
    // If error is a string
    if (typeof error === 'string') {
        // Check for network-related keywords
        if (error.toLowerCase().includes('network') || 
            error.toLowerCase().includes('connection') ||
            error.toLowerCase().includes('cannot connect')) {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }
        
        // Check for auth-related keywords
        if (error.toLowerCase().includes('unauthorized') || 
            error.toLowerCase().includes('not authorized')) {
            return ERROR_MESSAGES.AUTH_UNAUTHORIZED;
        }
        
        if (error.toLowerCase().includes('session expired') || 
            error.toLowerCase().includes('token expired')) {
            return ERROR_MESSAGES.AUTH_SESSION_EXPIRED;
        }
        
        if (error.toLowerCase().includes('incorrect') || 
            error.toLowerCase().includes('invalid credentials')) {
            return ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
        }
        
        // Return the error string if it's already user-friendly
        return error;
    }
    
    // If error is an Error object
    if (error instanceof Error) {
        const message = error.message || '';
        
        // Network errors
        if (message.includes('Network request failed') || 
            message.includes('Failed to fetch') ||
            message.includes('Cannot connect')) {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }
        
        // Timeout errors
        if (message.includes('timeout') || message.includes('timed out')) {
            return ERROR_MESSAGES.TIMEOUT_ERROR;
        }
        
        // If message is user-friendly, return it
        if (message.length > 0 && !message.includes('ExpoSecureStore') && 
            !message.includes('is not a function')) {
            return message;
        }
    }
    
    // If error is an object with response (Axios error)
    if (error?.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // Extract message from response
        if (data?.message) {
            return data.message;
        }
        
        // Handle based on status code
        switch (status) {
            case 400:
                return data?.error || 'Invalid request. Please check your input.';
            case 401:
                return ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
            case 403:
                return ERROR_MESSAGES.AUTH_UNAUTHORIZED;
            case 404:
                return ERROR_MESSAGES.DATA_NOT_FOUND;
            case 408:
                return ERROR_MESSAGES.TIMEOUT_ERROR;
            case 500:
            case 502:
            case 503:
            case 504:
                return ERROR_MESSAGES.SERVER_ERROR;
            default:
                return ERROR_MESSAGES.UNKNOWN_ERROR;
        }
    }
    
    // Default fallback
    return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Show error alert to user
 * @param {Error|string|Object} error - The error to display
 * @param {string} title - Optional custom title
 * @param {Function} onDismiss - Optional callback when dismissed
 */
export const showError = (error, title = 'Error', onDismiss) => {
    const message = parseError(error);
    
    Alert.alert(
        title,
        message,
        [
            {
                text: 'OK',
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
export const showSuccess = (message, title = 'Success', onDismiss) => {
    Alert.alert(
        title,
        message,
        [
            {
                text: 'OK',
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
    title = 'Confirm'
) => {
    Alert.alert(
        title,
        message,
        [
            {
                text: 'Cancel',
                onPress: onCancel,
                style: 'cancel',
            },
            {
                text: 'Confirm',
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
    const message = typeof error === 'string' ? error : error?.message || '';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('timeout')) {
        return 'warning';
    }
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
        return 'info';
    }
    if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
        return 'error';
    }
    if (lowerMessage.includes('critical') || lowerMessage.includes('fatal')) {
        return 'fatal';
    }
    return 'error';
};

/**
 * Log error for debugging and send to error tracking service
 * @param {Error|string} error - The error to log
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = '') => {
    // Track in analytics
    if (errorAnalytics) {
        errorAnalytics.trackError(error, context, {
            platform: Platform.OS,
            timestamp: Date.now(),
        });
    }

    // Always log to console for debugging (both dev and production)
    console.error(`[${context}] Error:`, error);
    
    // Send to Sentry (handles both Expo Go and native builds)
    if (!__DEV__) {
        const severity = getSeverity(error);
        captureException(error instanceof Error ? error : new Error(String(error)), {
            tags: { context },
            level: severity,
            extra: {
                platform: Platform.OS,
                timestamp: new Date().toISOString(),
            },
        });
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
        if (!value || (typeof value === 'string' && !value.trim())) {
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
    return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Handle async operation with error handling
 * @param {Function} asyncFn - Async function to execute
 * @param {Function} setLoading - Loading state setter
 * @param {Function} setError - Error state setter (optional)
 * @param {string} errorContext - Context for error logging
 */
export const handleAsync = async (asyncFn, setLoading, setError, errorContext = '') => {
    try {
        setLoading(true);
        if (setError) setError(null);
        
        const result = await asyncFn();
        return result;
    } catch (error) {
        logError(error, errorContext);
        
        const errorMessage = parseError(error);
        
        if (setError) {
            setError(errorMessage);
        } else {
            showError(error);
        }
        
        throw error; // Re-throw for caller to handle if needed
    } finally {
        setLoading(false);
    }
};

export default {
    ERROR_TYPES,
    ERROR_MESSAGES,
    parseError,
    showError,
    showSuccess,
    showConfirmation,
    logError,
    validateRequiredFields,
    validateEmail,
    validatePhone,
    handleAsync,
};
