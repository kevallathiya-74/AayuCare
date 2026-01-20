/**
 * AayuCare - Better Auth Client
 * React Native / Expo authentication with Better Auth
 */

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { AppConfig } from "../config/app";

// Better Auth expects base URL WITHOUT /api suffix
// Backend Better Auth is mounted at: /api/auth/*
// So we need: https://aayucare-backend.onrender.com (Better Auth will append /api/auth)
const getAuthBaseURL = () => {
  const baseURL = AppConfig.api.baseURL; // https://aayucare-backend.onrender.com/api
  return baseURL.replace(/\/api$/, ""); // Remove trailing /api -> https://aayucare-backend.onrender.com
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
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
    console.log("[BetterAuth] Login started");
    const userInput = credentials.userId || credentials.email;
    console.log("[BetterAuth] - Input:", userInput);

    // Check if input is email format or userId
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput);
    let emailToUse = userInput;

    // If not an email, assume it's a userId and fetch the email
    if (!isEmail) {
      console.log(
        "[BetterAuth] - Input is userId, fetching email from database..."
      );
      console.log(
        "[BetterAuth] - Calling:",
        `${AppConfig.api.baseURL}/user/email-by-userid`
      );

      try {
        // Call backend API to get user email by userId with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for Render cold start

        const response = await fetch(
          `${AppConfig.api.baseURL}/user/email-by-userid`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ userId: userInput }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        console.log(
          "[BetterAuth] - Email lookup response status:",
          response.status
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "[BetterAuth] - Email lookup failed:",
            response.status,
            errorText
          );
          throw new Error(`User not found (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        if (!data.email) {
          throw new Error("No email in response");
        }

        emailToUse = data.email;
        console.log("[BetterAuth] - Found email:", emailToUse);
      } catch (err) {
        console.error(
          "[BetterAuth] Failed to fetch email - Error:",
          err.name,
          err.message
        );

        if (err.name === "AbortError") {
          throw new Error(
            "Backend is starting (cold start on Render). Please wait 30 seconds and try again."
          );
        }

        throw new Error(`Could not find user: ${userInput}. ${err.message}`);
        console.error(
          "[BetterAuth] Failed to fetch email:",
          err.message || err
        );
        if (err.name === "AbortError") {
          throw new Error(
            "Request timeout. Please check your internet connection."
          );
        }
        throw new Error("User not found. Please check your User ID.");
      }
    }

    console.log("[BetterAuth] - Auth Base URL:", getAuthBaseURL());
    console.log(
      "[BetterAuth] - Will call:",
      getAuthBaseURL() + "/api/auth/sign-in/email"
    );
    console.log("[BetterAuth] - Using email:", emailToUse);

    console.log("[BetterAuth] - Calling Better Auth signIn.email()...");
    const result = await signIn.email({
      email: emailToUse,
      password: credentials.password,
    });

    console.log(
      "[BetterAuth] Login complete, result:",
      JSON.stringify(result, null, 2)
    );

    // Better Auth returns { data, error }
    if (result.error) {
      console.error("[BetterAuth] Login error from Better Auth:", result.error);
      throw new Error(result.error.message || result.error || "Login failed");
    }

    // Extract user and session from Better Auth response
    const user = result.data?.user;
    const session = result.data?.session;

    if (!user) {
      console.error("[BetterAuth] No user in response");
      console.error(
        "[BetterAuth] Full result:",
        JSON.stringify(result, null, 2)
      );
      throw new Error("Login failed - no user data");
    }

    console.log("[BetterAuth] User data:", JSON.stringify(user, null, 2));
    console.log(
      "[BetterAuth] Session token:",
      session?.token ? "exists" : "missing"
    );

    // Store session in SecureStore for persistence
    if (session?.token) {
      console.log("[BetterAuth] Saving session to SecureStore...");
      await SecureStore.setItemAsync(`aayucare.session.token`, session.token);
      await SecureStore.setItemAsync(`aayucare.user`, JSON.stringify(user));
      console.log("[BetterAuth] Session saved to SecureStore");
    } else {
      console.warn("[BetterAuth] No session token to save");
    }

    // Return in format expected by authSlice
    console.log("[BetterAuth] Returning user and token to authSlice");
    return {
      user: user,
      token: session?.token || null,
    };
  } catch (error) {
    console.error("[BetterAuth] Login error caught:", error);
    console.error("[BetterAuth] Error type:", error?.name);
    console.error("[BetterAuth] Error message:", error?.message);
    throw error;
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
 * Get current session from Better Auth
 * Uses Better Auth's built-in session retrieval (checks local storage first)
 */
export const getSession = async () => {
  try {
    // Better Auth expo client stores session in SecureStore automatically
    // Read directly from storage with correct key format
    const storagePrefix = "aayucare";

    // Try to get session token from storage
    const sessionData = await SecureStore.getItemAsync(
      `${storagePrefix}.session.token`
    );

    if (!sessionData) {
      console.log("[BetterAuth] No session found in storage");
      return null;
    }

    // Parse session data if it's JSON string
    let token = sessionData;
    try {
      const parsed = JSON.parse(sessionData);
      token = parsed.token || sessionData;
    } catch {
      // sessionData is already a plain token string
    }

    // Try to get user data from storage
    const userDataStr = await SecureStore.getItemAsync(`${storagePrefix}.user`);

    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        console.log(
          "[BetterAuth] Session loaded from storage:",
          user?.userId || user?.email
        );
        return { user, token };
      } catch (parseError) {
        console.warn("[BetterAuth] Could not parse user data, token only");
      }
    }

    console.log("[BetterAuth] Token found but no user data");
    return { token };
  } catch (error) {
    console.error("[BetterAuth] Get session error:", error?.message || error);
    // Return null instead of throwing - allows app to continue
    return null;
  }
};

/**
 * Check if user is authenticated (instant, no network call)
 */
export const isAuthenticated = async () => {
  try {
    const session = await getSession();
    return !!session?.user || !!session?.token;
  } catch (error) {
    console.error("[BetterAuth] isAuthenticated error:", error?.message);
    return false;
  }
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
