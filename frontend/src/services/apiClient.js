/**
 * AayuCare - API Service Configuration
 * Production-ready Axios instance with interceptors and offline support
 */

import axios from "axios";
import appStorage from "../utils/appStorage";
import { STORAGE_KEYS } from "../utils/constants";
import { APP_CONFIG } from "../config/appConfig";
import { parseError } from "../utils/errorHandler";

// Runtime guard: Ensure appStorage is properly wired
if (!appStorage || typeof appStorage.getItem !== "function") {
  if (__DEV__) {
    console.error("[API] CRITICAL: appStorage module not properly loaded!");
    console.error("[API] appStorage:", appStorage);
  }
  throw new Error("appStorage module is not properly initialized");
}

const normalizedBaseUrl = String(APP_CONFIG?.api?.baseURL ?? "")
  .trim()
  .replace(/\/+$/, "");
if (!normalizedBaseUrl) {
  throw new Error(
    "CRITICAL: No API base URL configured. Set EXPO_PUBLIC_API_BASE_URL.",
  );
}
const apiBaseV1 = normalizedBaseUrl.endsWith("/v1")
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/v1`;

const api = axios.create({
  baseURL: apiBaseV1,
  timeout: APP_CONFIG.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log API URL for debugging (dev only)
if (__DEV__) {
  console.warn("[API] API Base URL:", apiBaseV1);
  console.warn(
    "[API] Environment:",
    APP_CONFIG.env.isDevelopment ? "Development" : "Production",
  );
  console.warn("[API] Expo Go:", APP_CONFIG.env.isExpoGo);
}

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await appStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const localConfig = config;
      const headers = localConfig.headers || {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        localConfig.headers = headers;
        if (__DEV__) {
          console.warn("[TOKEN] Authorization header set");
        }
      } else {
        if (__DEV__) {
          console.warn("⚠️ No auth token found in storage");
        }
      }

      if (__DEV__) {
        console.warn(`[REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    } catch (error) {
      if (__DEV__) {
        console.error("[ERROR] Error getting auth token:", error);
      }
      return config;
    }
  },
  (error) => {
    if (__DEV__) {
      console.error("[ERROR] Request interceptor error:", error);
    }
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    // Return original response instead of mutating `response.data` in place to preserve caching
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints (login, register)
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/sign-in") ||
      originalRequest.url?.includes("/auth/sign-up") ||
      originalRequest.url?.includes("/auth/refresh");

    // Handle 401 Unauthorized - Session expired (Better Auth uses session tokens, not refresh tokens)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      if (__DEV__) {
        console.warn("[API] 401 error - Session expired, clearing storage");
      }

      // Better Auth doesn't use refresh tokens - session is managed server-side
      // Clear storage and force re-login
      await appStorage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
      await appStorage.deleteItem(STORAGE_KEYS.USER_DATA);

      const authError = new Error("Session expired. Please login again.");
      authError.code = "AUTH_EXPIRED";
      return Promise.reject(authError);
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error(
        "Unable to connect to server. Please check your internet connection and try again.",
      );
      if (__DEV__) {
        console.warn("[NETWORK] Network Error");
        console.warn(
          "[INFO] Attempted URL:",
          error.config?.baseURL + error.config?.url,
        );
        console.warn("[INFO] API Base URL:", APP_CONFIG.api.baseURL);
      }
      return Promise.reject(networkError);
    }

    const errorMessage = parseError(error);
    if (__DEV__) {
      console.error("[ERROR] API Error:", errorMessage);
      if (error.response?.data?.message) {
        console.warn(
          "[ERROR] Raw server message:",
          error.response.data.message,
        );
      }
    }

    const safeError = new Error(errorMessage);
    safeError.code = error.response?.data?.code || error.code;
    safeError.status = error.response?.status;
    return Promise.reject(safeError);
  },
);

// Test API connectivity (useful for debugging)
export default api;
