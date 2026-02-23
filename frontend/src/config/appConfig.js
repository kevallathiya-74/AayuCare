/**
 * AayuCare - Global Application Configuration
 * SINGLE SOURCE OF TRUTH for all app configuration
 * 
 * This file consolidates:
 * - API configuration
 * - Environment variables
 * - Feature flags
 * - App metadata
 * 
 * Import this file ONLY using:
 * import { APP_CONFIG } from '../config/appConfig';
 * OR
 * import APP_CONFIG from '../config/appConfig';
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

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
 * Get the backend API URL based on environment
 */
const getApiBaseUrl = () => {
  // Check for explicit environment variable first
  const envUrl = getEnvVar("API_BASE_URL");
  if (envUrl) {
    if (__DEV__) {
      console.log('[APP_CONFIG] Using explicit API URL:', envUrl);
    }
    return envUrl;
  }

  // For development: Try to detect if local backend is running
  // Expo Go users: Use your computer's local IP
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (__DEV__ && isExpoGo) {
    // Get the manifest URL to extract the local IP
    const manifestUrl = Constants.expoConfig?.hostUri;
    
    if (manifestUrl) {
      const localIp = manifestUrl.split(':')[0]; // Extract IP from exp://192.168.x.x:8081
      const localBackendUrl = `http://${localIp}:5000/api`;
      if (__DEV__) {
        console.log('[APP_CONFIG] Development mode - using local backend:', localBackendUrl);
      }
      return localBackendUrl;
    }
  }

  // Fallback to production backend (Render)
  const prodUrl = getEnvVar("PRODUCTION_API_URL", "https://aayucare-backend.onrender.com/api");
  if (__DEV__) {
    console.log('[APP_CONFIG] Using production backend:', prodUrl);
  }
  return prodUrl;
};

/**
 * Global Application Configuration Object
 * This is the ONLY configuration export for the entire app
 */
export const APP_CONFIG = {
  // App Information
  app: {
    name: Constants.expoConfig?.name || "AayuCare",
    version: Constants.expoConfig?.version || "1.0.0",
    slug: Constants.expoConfig?.slug || "aayucare",
  },

  // API Configuration
  api: {
    baseURL: getApiBaseUrl(),
    timeout: 30000,
  },

  // Sentry Configuration
  sentry: {
    dsn: getEnvVar("SENTRY_DSN", getEnvVar("sentryDSN", null)),
    enabled: getEnvVar("ENABLE_ERROR_TRACKING", "true") === "true",
  },

  // Analytics Configuration
  analytics: {
    enabled: getEnvVar("ENABLE_ANALYTICS", "true") === "true",
  },

  // Feature Flags
  features: {
    debugMode: __DEV__ || getEnvVar("DEBUG_MODE", "false") === "true",
    verboseLogging: getEnvVar("VERBOSE_LOGGING", "false") === "true",
  },

  // Environment
  env: {
    isDevelopment: __DEV__,
    isProduction: !__DEV__,
    isExpoGo: Constants.appOwnership === "expo",
    platform: Platform.OS,
  },
};

// Default export for backwards compatibility
export default APP_CONFIG;

// Log configuration on initialization (only in development)
if (__DEV__) {
  console.log('[APP_CONFIG] Initialized:', {
    apiUrl: APP_CONFIG.api.baseURL,
    environment: APP_CONFIG.env.isDevelopment ? 'Development' : 'Production',
    platform: APP_CONFIG.env.platform,
  });
}
