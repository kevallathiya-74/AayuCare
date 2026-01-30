/**
 * Sentry Configuration
 * 
 * Centralizes Sentry initialization with proper environment handling
 * Gracefully handles Expo Go limitations
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Lazy import Sentry to prevent crash if not available
let Sentry = null;
try {
    Sentry = require('@sentry/react-native');
} catch (e) {
    console.log('[Sentry] Module not available in Expo Go');
}

/**
 * Check if running in Expo Go
 * Expo Go doesn't support native Sentry features
 */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Track initialization state
 */
let sentryInitialized = false;

/**
 * Get Sentry DSN from configuration
 */
const getSentryDSN = () => {
    try {
        // Try expo config extra
        const dsn = Constants.expoConfig?.extra?.SENTRY_DSN || 
                    Constants.expoConfig?.extra?.sentryDSN ||
                    null;
        
        // Validate DSN format - ensure dsn is a string before calling includes
        if (dsn && typeof dsn === 'string' && !dsn.includes('your-dsn-here') && dsn !== 'null' && dsn !== '') {
            return dsn;
        }
    } catch (e) {
        console.log('[Sentry] Error getting DSN:', e.message);
    }

    return null;
};

/**
 * Initialize Sentry with proper configuration
 * Safe for both Expo Go and EAS builds
 */
export const initializeSentry = () => {
    // Skip if already initialized
    if (sentryInitialized) {
        console.log('[Sentry] Already initialized');
        return;
    }

    // Skip in Expo Go
    if (isExpoGo) {
        console.log('[Sentry] Skipped - running in Expo Go');
        return;
    }

    // Skip if Sentry module not available
    if (!Sentry) {
        console.log('[Sentry] Skipped - module not available');
        return;
    }

    const dsn = getSentryDSN();
    
    // Skip if no DSN configured
    if (!dsn) {
        console.log('[Sentry] Skipped - no DSN configured');
        return;
    }

    try {
        Sentry.init({
            dsn,
            debug: __DEV__,
            environment: __DEV__ ? 'development' : 'production',
            enableAutoSessionTracking: true,
            sessionTrackingIntervalMillis: 30000,
            tracesSampleRate: __DEV__ ? 1.0 : 0.2,
            enableNative: !isExpoGo,
            enableNativeCrashHandling: !isExpoGo,
            attachStacktrace: true,
            beforeSend(event) {
                // Filter out development errors
                if (__DEV__) {
                    console.log('[Sentry] Event captured:', event);
                }
                return event;
            },
        });

        sentryInitialized = true;
        console.log('[Sentry] Initialized successfully');
    } catch (error) {
        console.error('[Sentry] Initialization failed:', error);
    }
};

/**
 * Check if Sentry is enabled
 */
export const isSentryEnabled = () => {
    return sentryInitialized && !isExpoGo && !!Sentry;
};

/**
 * Capture exception safely
 */
export const captureException = (error, context = {}) => {
    if (!isSentryEnabled()) {
        // No Sentry configured, just console log
        console.error('[Error]', context, error);
        return;
    }

    try {
        Sentry.captureException(error, {
            tags: context.tags || {},
            extra: context.extra || {},
            level: context.level || 'error',
            contexts: context.contexts || {},
        });
    } catch (sentryError) {
        console.error('[Sentry] Failed to capture exception:', sentryError);
        console.error('[Original Error]', error);
    }
};

/**
 * Capture message safely
 */
export const captureMessage = (message, level = 'info', context = {}) => {
    if (!isSentryEnabled()) {
        console.log(`[${level.toUpperCase()}]`, message, context);
        return;
    }

    try {
        Sentry.captureMessage(message, {
            level,
            tags: context.tags || {},
            extra: context.extra || {},
        });
    } catch (error) {
        console.error('[Sentry] Failed to capture message:', error);
    }
};

/**
 * Set user context
 */
export const setUser = (user) => {
    if (!isSentryEnabled()) return;

    try {
        Sentry.setUser(user ? {
            id: user.id,
            email: user.email,
            username: user.name,
        } : null);
    } catch (error) {
        console.error('[Sentry] Failed to set user:', error);
    }
};

/**
 * Add breadcrumb
 */
export const addBreadcrumb = (breadcrumb) => {
    if (!isSentryEnabled()) return;

    try {
        Sentry.addBreadcrumb({
            message: breadcrumb.message,
            category: breadcrumb.category || 'general',
            level: breadcrumb.level || 'info',
            data: breadcrumb.data || {},
        });
    } catch (error) {
        console.error('[Sentry] Failed to add breadcrumb:', error);
    }
};

/**
 * Default export with all methods
 */
export default {
    initialize: initializeSentry,
    captureException,
    captureMessage,
    setUser,
    addBreadcrumb,
    isEnabled: isSentryEnabled,
};

