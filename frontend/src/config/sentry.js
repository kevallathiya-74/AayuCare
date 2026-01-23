/**
 * Sentry Configuration
 * 
 * Centralizes Sentry initialization with proper environment handling
 * Gracefully handles Expo Go limitations
 */

import Constants from 'expo-constants';

// Lazy import Sentry to prevent crash if not available
let Sentry = null;
try {
    Sentry = require('@sentry/react-native');
} catch (e) {
    console.log('[Sentry] Module not available');
}

/**
 * Check if running in Expo Go
 * Expo Go doesn't support native Sentry features
 */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Get Sentry DSN from configuration
 */
const getSentryDSN = () => {
    try {
        // Try expo config extra
        const dsn = Constants.expoConfig?.extra?.SENTRY_DSN || 
                    Constants.expoConfig?.extra?.sentryDSN ||
                    null;
        
        // Validate DSN format
        if (dsn && !dsn.includes('your-dsn-here') && dsn !== 'null' && dsn !== '') {
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
    // Skip if Sentry module is not available
    if (!Sentry) {
        if (__DEV__) {
            console.log('[Sentry] Skipped: Module not available');
        }
        return;
    }

    const dsn = getSentryDSN();

    // Skip initialization if no valid DSN
    if (!dsn) {
        if (__DEV__) {
            console.log('[Sentry] Skipped: No valid DSN configured');
        }
        return;
    }

    // Skip in Expo Go - native modules don't work
    if (isExpoGo) {
        console.log('[Sentry] Skipped: Running in Expo Go');
        return;
    }

    try {
        Sentry.init({
            dsn,
            environment: __DEV__ ? 'development' : 'production',
            tracesSampleRate: __DEV__ ? 1.0 : 0.2,
            enableAutoSessionTracking: true,
            debug: __DEV__,
            attachStacktrace: true,
            enableNative: true,
            enableNativeCrashHandling: true,
            release: Constants.expoConfig?.version || '1.0.0',
        });
        
        if (__DEV__) {
            console.log('[Sentry] Initialized successfully');
        }
    } catch (error) {
        console.log('[Sentry] Initialization error:', error.message);
    }
};

/**
 * Capture exception safely
 * Works in both Expo Go and native builds
 */
export const captureException = (error, context = {}) => {
    const dsn = getSentryDSN();
    
    if (!dsn || !Sentry) {
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
    const dsn = getSentryDSN();
    
    if (!dsn || !Sentry) {
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
    const dsn = getSentryDSN();
    if (!dsn || !Sentry) return;

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
    const dsn = getSentryDSN();
    if (!dsn || !Sentry) return;

    try {
        Sentry.addBreadcrumb(breadcrumb);
    } catch (error) {
        console.error('[Sentry] Failed to add breadcrumb:', error);
    }
};

/**
 * Check if Sentry is configured and ready
 */
export const isSentryEnabled = () => {
    return getSentryDSN() !== null && Sentry !== null;
};

export default {
    initialize: initializeSentry,
    captureException,
    captureMessage,
    setUser,
    addBreadcrumb,
    isEnabled: isSentryEnabled,
};

