/**
 * AayuCare - Better Auth Client
 * React Native / Expo authentication with Better Auth
 */

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import config from "../config/app";

export const authClient = createAuthClient({
  baseURL: config.API_BASE_URL || "http://localhost:5000",
  plugins: [
    expoClient({
      scheme: "aayucare",
      storagePrefix: "aayucare",
      storage: SecureStore,
    }),
  ],
});

// Export Better Auth methods
export const { signIn, signUp, signOut, useSession, $fetch } = authClient;

/**
 * Register new user
 */
export const register = async (userData) => {
  try {
    console.log("[BetterAuth] Registering:", userData.userId);

    const result = await signUp.email({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      userId: userData.userId,
      phone: userData.phone,
      role: userData.role || "patient",
      hospitalId: userData.hospitalId,
      hospitalName: userData.hospitalName,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      specialization: userData.specialization,
      qualification: userData.qualification,
      experience: userData.experience,
      consultationFee: userData.consultationFee,
      department: userData.department,
      address: userData.address,
    });

    console.log("[BetterAuth] Registration complete");
    return result;
  } catch (error) {
    console.error("[BetterAuth] Register error:", error);
    throw new Error(error.message || "Registration failed");
  }
};

/**
 * Login user
 */
export const login = async (credentials) => {
  try {
    console.log("[BetterAuth] Login:", credentials.userId || credentials.email);

    const result = await signIn.email({
      email: credentials.email || credentials.userId,
      password: credentials.password,
    });

    console.log("[BetterAuth] Login complete");
    return result;
  } catch (error) {
    console.error("[BetterAuth] Login error:", error);
    throw new Error(error.message || "Login failed");
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    console.log("[BetterAuth] Logging out...");
    await signOut();
    console.log("[BetterAuth] Logout complete");
    return { success: true };
  } catch (error) {
    console.error("[BetterAuth] Logout error:", error);
    return { success: true }; // Always succeed locally
  }
};

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const session = await $fetch("/api/auth/get-session");
    return session;
  } catch (error) {
    console.error("[BetterAuth] Get session error:", error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session?.user;
};

/**
 * Update user profile
 */
export const updateProfile = async (updates) => {
  try {
    const response = await $fetch("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { success: true, user: response.data?.user };
  } catch (error) {
    console.error("[BetterAuth] Update profile error:", error);
    throw new Error(error.message || "Profile update failed");
  }
};

/**
 * Change password
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    await $fetch("/api/user/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { success: true };
  } catch (error) {
    console.error("[BetterAuth] Change password error:", error);
    throw new Error(error.message || "Password change failed");
  }
};

// Get user data from session
export const getUserData = async () => {
  const session = await getSession();
  return session?.user || null;
};

// Get auth token (for API requests)
export const getAuthToken = async () => {
  const session = await getSession();
  return session?.token || null;
};

// Export all functions
export default {
  authClient,
  register,
  login,
  logout,
  getSession,
  isAuthenticated,
  updateProfile,
  changePassword,
  getUserData,
  getAuthToken,
  signIn,
  signUp,
  signOut,
  useSession,
};
