/**
 * Application Configuration
 * Centralized configuration management
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
    return envUrl;
  }

  // Production mode - use production API
  if (!__DEV__) {
    return getEnvVar("PRODUCTION_API_URL", "https://api.aayucare.com/api");
  }

  // Development mode - auto-detect host
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];

    // Skip tunnel URLs - they don't expose backend
    if (
      !host.includes("exp.direct") &&
      !host.includes("ngrok") &&
      !host.includes("expo.dev")
    ) {
      return `http://${host}:5000/api`;
    }
  }

  // Fallback for development
  return Platform.OS === "web"
    ? "http://localhost:5000/api"
    : "http://10.0.2.2:5000/api";
};

/**
 * Application Configuration
 */
export const AppConfig = {
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
  },
};

export default AppConfig;
