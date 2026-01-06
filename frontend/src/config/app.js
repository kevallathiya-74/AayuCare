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
    console.log('[Config] Using explicit API URL:', envUrl);
    return envUrl;
  }

  // Production mode - use production API
  if (!__DEV__) {
    const prodUrl = getEnvVar("PRODUCTION_API_URL", "https://aayucare-backend.onrender.com/api");
    console.log('[Config] Production mode - API URL:', prodUrl);
    return prodUrl;
  }

  // Development mode - auto-detect host
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  console.log('[Config] Debugger Host detected:', debuggerHost);

  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];

    // Check if using tunnel mode
    if (
      host.includes("exp.direct") ||
      host.includes("ngrok") ||
      host.includes("expo.dev")
    ) {
      console.warn('[Config] ⚠️ Tunnel mode detected - backend must be exposed via ngrok');
      console.warn('[Config] Set API_BASE_URL in app.json extra or use LAN mode');
      
      // Check for ngrok URL in config
      const ngrokUrl = getEnvVar("BACKEND_NGROK_URL");
      if (ngrokUrl) {
        console.log('[Config] Using ngrok URL:', ngrokUrl);
        return ngrokUrl;
      }
      
      // Fallback to localhost for Android emulator
      const fallbackUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
      console.warn('[Config] Falling back to:', fallbackUrl);
      return fallbackUrl;
    }

    // LAN mode - use detected IP
    const lanUrl = `http://${host}:5000/api`;
    console.log('[Config] LAN mode - API URL:', lanUrl);
    return lanUrl;
  }

  // Fallback for development
  const fallbackUrl = Platform.OS === "web"
    ? "http://localhost:5000/api"
    : Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"  // Android emulator
    : "http://localhost:5000/api";
  
  console.warn('[Config] No debugger host - falling back to:', fallbackUrl);
  return fallbackUrl;
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
