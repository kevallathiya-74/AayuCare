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

const normalizeEnv = (value) => {
  const v = String(value || "").trim().toLowerCase();
  return v === "production" || v === "development" || v === "test" ? v : null;
};

const normalizeUrl = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  return trimmed.replace(/\/+$/, "");
};

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

const runtimeNodeEnv =
  normalizeEnv(getEnvVar("EXPO_PUBLIC_NODE_ENV")) ||
  normalizeEnv(getEnvVar("NODE_ENV")) ||
  (__DEV__ ? "development" : "production");

const isDevEnv = runtimeNodeEnv !== "production";

/**
 * Get the backend API URL based on environment
 */
const getApiBaseUrl = () => {
  const explicitUrl = normalizeUrl(
    getEnvVar("EXPO_PUBLIC_API_BASE_URL") ||
    getEnvVar("API_BASE_URL")
  );
  if (explicitUrl) {
    if (__DEV__) {
      console.log('[APP_CONFIG] Using explicit API URL:', explicitUrl);
    }
    return explicitUrl;
  }

  if (!isDevEnv) {
    const prodUrl = normalizeUrl(
      getEnvVar("EXPO_PUBLIC_API_BASE_URL_PROD") ||
      getEnvVar("PRODUCTION_API_URL") ||
      getEnvVar("API_BASE_URL_PROD")
    );

    if (prodUrl) {
      return prodUrl;
    }
  }

  // Development mode auto-detection
  if (isDevEnv) {
    const isExpoGo = Constants.appOwnership === 'expo';
    const manifestUrl = Constants.expoConfig?.hostUri;

    // 1. Web Localhost
    if (Platform.OS === 'web') {
      const webUrl = 'http://localhost:5000/api';
      console.log('[APP_CONFIG] Web Development - using local backend:', webUrl);
      return webUrl;
    }

    // 2. Expo Go / LAN (works for emulator + physical device)
    // hostUri is usually like: 10.130.73.190:8081
    if (isExpoGo && manifestUrl) {
      const localIp = manifestUrl.split(':')[0];
      if (localIp) {
        const localBackendUrl = `http://${localIp}:5000/api`;
        console.log('[APP_CONFIG] Expo Go Development - using hostUri backend:', localBackendUrl);
        return localBackendUrl;
      }
    }
    
    // 3. Android Emulator mapping fallback
    // Android emulator maps 10.0.2.2 to host machine's localhost
    if (Platform.OS === 'android' && !Constants.isDevice) {
      const androidEmulatorUrl = 'http://10.0.2.2:5000/api';
      console.log('[APP_CONFIG] Android Emulator Fallback - using host backend:', androidEmulatorUrl);
      return androidEmulatorUrl;
    }

    // 4. iOS Simulator mapping
    if (Platform.OS === 'ios' && !Constants.isDevice) {
      const iosDevUrl = 'http://localhost:5000/api';
      console.log('[APP_CONFIG] iOS Simulator - using local backend:', iosDevUrl);
      return iosDevUrl;
    }
  }

  // Production fallback from configured app extra/env only.
  const prodUrl = normalizeUrl(
    getEnvVar("EXPO_PUBLIC_API_BASE_URL_PROD") ||
    getEnvVar("PRODUCTION_API_URL") ||
    getEnvVar("API_BASE_URL_PROD")
  );
  if (__DEV__) {
    console.log('[APP_CONFIG] Fallback to production backend:', prodUrl);
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
    debugMode: isDevEnv || getEnvVar("DEBUG_MODE", "false") === "true",
    verboseLogging: getEnvVar("VERBOSE_LOGGING", "false") === "true",
  },

  // Environment
  env: {
    nodeEnv: runtimeNodeEnv,
    isDevelopment: isDevEnv,
    isProduction: !isDevEnv,
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
