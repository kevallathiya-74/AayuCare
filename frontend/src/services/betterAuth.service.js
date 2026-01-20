/**
 * AayuCare - Better Auth Service
 * Modern authentication with Better Auth
 */

import { createAuthClient } from "better-auth/react-native";
import api from "./api";
import * as storage from "../utils/secureStorage";
import { STORAGE_KEYS } from "../utils/constants";
import config from "../config/app";

/**
 * Better Auth Client Configuration
 */
export const authClient = createAuthClient({
  baseURL: config.API_BASE_URL || "http://localhost:5000",
  basePath: "/api/auth/better",
});

/**
 * Get stored auth token
 */
export const getAuthToken = async () => {
  try {
    return await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error("[BetterAuthService] Get token error:", error);
    return null;
  }
};

/**
 * Get stored user data
 */
export const getUserData = async () => {
  try {
    const userData = await storage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("[BetterAuthService] Get user data error:", error);
    return null;
  }
};

/**
 * Register new user with Better Auth
 */
export const register = async (userData) => {
  try {
    console.log(
      "[BetterAuthService] Sending register request:",
      userData.userId
    );

    // Use custom backend endpoint for registration (maintains compatibility)
    const response = await api.post("/auth/register", userData);
    console.log("[BetterAuthService] Registration response:", response.data);

    const data = response.data?.data;

    if (!data) {
      throw new Error("Invalid server response");
    }

    const { user, token, refreshToken, session } = data;

    if (!user || !token) {
      throw new Error("Invalid registration response from server");
    }

    // Store tokens and user data securely
    try {
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || token);
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      if (session) {
        await storage.setItem(
          STORAGE_KEYS.SESSION_DATA,
          JSON.stringify(session)
        );
      }

      console.log("[BetterAuthService] Registration storage complete");
    } catch (storageError) {
      console.error("[BetterAuthService] Storage error:", storageError);
    }

    return { user, token, refreshToken, session };
  } catch (error) {
    console.error("[BetterAuthService] Register error:", error);
    const message =
      error.response?.data?.message || error.message || "Registration failed";
    throw new Error(message);
  }
};

/**
 * Login user with Better Auth
 */
export const login = async (credentials) => {
  try {
    console.log(
      "[BetterAuthService] Sending login request:",
      credentials.userId
    );

    // Use custom backend endpoint for login (maintains compatibility)
    const response = await api.post("/auth/login", credentials);
    console.log("[BetterAuthService] Login response received");

    const data = response.data?.data;

    if (!data) {
      throw new Error("Invalid server response");
    }

    const { user, token, refreshToken, session } = data;

    if (!user || !token) {
      throw new Error("Invalid login response from server");
    }

    // Store authentication data
    try {
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || token);
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      if (session) {
        await storage.setItem(
          STORAGE_KEYS.SESSION_DATA,
          JSON.stringify(session)
        );
      }

      console.log("[BetterAuthService] Login storage complete");
    } catch (storageError) {
      console.error("[BetterAuthService] Storage error:", storageError);
    }

    return { user, token, refreshToken, session };
  } catch (error) {
    console.error("[BetterAuthService] Login error:", error);
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Login failed";
    throw new Error(message);
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    console.log("[BetterAuthService] Logging out...");

    // Call backend logout endpoint
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log("[BetterAuthService] Backend logout warning:", error.message);
    }

    // Clear all stored data
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER_DATA);
    await storage.removeItem(STORAGE_KEYS.SESSION_DATA);

    console.log("[BetterAuthService] Logout complete");
    return { success: true };
  } catch (error) {
    console.error("[BetterAuthService] Logout error:", error);
    // Even if backend fails, clear local storage
    try {
      await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await storage.removeItem(STORAGE_KEYS.USER_DATA);
      await storage.removeItem(STORAGE_KEYS.SESSION_DATA);
    } catch (clearError) {
      console.error("[BetterAuthService] Storage clear error:", clearError);
    }
    return { success: true };
  }
};

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const token = await getAuthToken();
    const user = await getUserData();

    if (!token || !user) {
      return null;
    }

    return { user, token };
  } catch (error) {
    console.error("[BetterAuthService] Get session error:", error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session;
};

/**
 * Refresh session token
 */
export const refreshSession = async () => {
  try {
    const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post("/auth/refresh", { refreshToken });
    const { token } = response.data?.data || {};

    if (token) {
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      return { success: true, token };
    }

    throw new Error("Token refresh failed");
  } catch (error) {
    console.error("[BetterAuthService] Refresh session error:", error);
    return { success: false };
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (updates) => {
  try {
    const response = await api.put("/auth/profile", updates);
    const { user } = response.data?.data || {};

    if (user) {
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }

    return { success: true, user };
  } catch (error) {
    console.error("[BetterAuthService] Update profile error:", error);
    throw new Error(error.response?.data?.message || "Profile update failed");
  }
};

// Maintain backwards compatibility - export old auth service functions
export default {
  register,
  login,
  logout,
  getSession,
  isAuthenticated,
  refreshSession,
  getAuthToken,
  getUserData,
  updateProfile,
  authClient,
};
