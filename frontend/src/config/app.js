/**
 * Application Configuration
 * Centralized configuration management
 */

import Constants from 'expo-constants';

/**
 * Get environment variable or fallback to expo config
 */
const getEnvVar = (key, fallback = null) => {
    // Try process.env first (works in EAS builds)
    if (process.env[key]) {
        return process.env[key];
    }
    
    // Try expo config extra
    if (Constants.expoConfig?.extra?.[key]) {
        return Constants.expoConfig.extra[key];
    }
    
    return fallback;
};

/**
 * Application Configuration
 */
export const AppConfig = {
    // App Information
    app: {
        name: Constants.expoConfig?.name || 'AayuCare',
        version: Constants.expoConfig?.version || '1.0.0',
        slug: Constants.expoConfig?.slug || 'aayucare',
    },

    // API Configuration
    api: {
        baseURL: getEnvVar('API_BASE_URL', 'http://10.9.15.29:5000/api'),
        timeout: 30000,
    },

    // Sentry Configuration
    sentry: {
        dsn: getEnvVar('SENTRY_DSN', getEnvVar('sentryDSN', null)),
        enabled: getEnvVar('ENABLE_ERROR_TRACKING', 'true') === 'true',
    },

    // Analytics Configuration
    analytics: {
        enabled: getEnvVar('ENABLE_ANALYTICS', 'true') === 'true',
    },

    // Feature Flags
    features: {
        debugMode: __DEV__ || getEnvVar('DEBUG_MODE', 'false') === 'true',
        verboseLogging: getEnvVar('VERBOSE_LOGGING', 'false') === 'true',
    },

    // Environment
    env: {
        isDevelopment: __DEV__,
        isProduction: !__DEV__,
        isExpoGo: Constants.appOwnership === 'expo',
    },
};

export default AppConfig;
