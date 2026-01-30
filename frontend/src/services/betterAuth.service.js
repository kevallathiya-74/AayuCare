/**
 * AayuCare - Better Auth Client
 * React Native / Expo authentication with Better Auth
 */

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { APP_CONFIG } from "../config/appConfig";
import { STORAGE_KEYS } from "../utils/constants";

// Better Auth expects base URL WITHOUT /api suffix
// Backend Better Auth is mounted at: /api/auth/*
// So we need: https://aayucare-backend.onrender.com (Better Auth will append /api/auth)
const getAuthBaseURL = () => {
  const baseURL = APP_CONFIG.api.baseURL; // https://aayucare-backend.onrender.com/api
  return baseURL.replace(/\/api$/, ""); // Remove trailing /api -> https://aayucare-backend.onrender.com
};

// Create and configure the auth client
const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [
    expoClient({
      scheme: "aayucare",
      storagePrefix: "aayucare_auth",
      storage: {
        get: async (key) => {
          try {
            return await SecureStore.getItemAsync(key);
          } catch (error) {
            console.error('[Auth] Storage get error:', error);
            return null;
          }
        },
        set: async (key, value) => {
          try {
            await SecureStore.setItemAsync(key, value);
          } catch (error) {
            console.error('[Auth] Storage set error:', error);
          }
        },
        remove: async (key) => {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (error) {
            console.error('[Auth] Storage remove error:', error);
          }
        },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, $fetch } = authClient;

// Export authClient as default
export default authClient;

