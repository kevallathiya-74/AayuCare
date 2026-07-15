/**
 * AayuCare - Secure Application Storage Module
 *
 * Production-grade storage using expo-secure-store for sensitive data.
 * Adheres to 2048-byte limit per key.
 *
 * WHY "appStorage" NOT "storage":
 * - Avoids conflicts with browser Storage API
 * - Prevents shadowing by bundler/polyfills
 * - Clear, unambiguous module identity
 */

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

const canUseLocalStorage = () => {
  if (!isWeb) return false;
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

const getWebItem = (key) => {
  if (!canUseLocalStorage()) return null;
  return window.localStorage.getItem(key);
};

const setWebItem = (key, value) => {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(key, value);
};

const removeWebItem = (key) => {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(key);
};

/**
 * Get item from storage
 * @param {string} key - Storage key
 * @returns {Promise<string|null>} Stored value or null
 */
export const getItem = async (key) => {
  try {
    if (isWeb) {
      return getWebItem(key);
    }
    const value = await SecureStore.getItemAsync(key);
    return value;
  } catch (error) {
    if (__DEV__) {
      console.error(`[appStorage] getItem error for key "${key}":`, error);
    }
    return null;
  }
};

/**
 * Get item from storage synchronously
 */
export const getItemSync = (key) => {
  try {
    if (isWeb) {
      return getWebItem(key);
    }
    return SecureStore.getItem(key);
  } catch (error) {
    if (__DEV__) {
      console.error(`[appStorage] getItemSync error for key "${key}":`, error);
    }
    return null;
  }
};

/**
 * Set item in storage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {Promise<void>}
 */
export const setItem = async (key, value) => {
  try {
    if (isWeb) {
      setWebItem(key, value);
      return;
    }

    if (value && value.length > 2000) {
      if (__DEV__) {
        console.warn(
          `[appStorage] WARNING: Value for key "${key}" is approaching SecureStore limit.`
        );
      }
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    if (__DEV__) {
      console.error(`[appStorage] setItem error for key "${key}":`, error);
    }
    throw error;
  }
};

/**
 * Remove item from storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export const deleteItem = async (key) => {
  try {
    if (isWeb) {
      removeWebItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    if (__DEV__) {
      console.error(`[appStorage] deleteItem error for key "${key}":`, error);
    }
    throw error;
  }
};


/**
 * Clear all storage
 * NOTE: SecureStore doesn't have a direct 'clear' method.
 * We must manually clear known keys or use a prefix.
 * For now, we clear the core auth/user keys.
 * @returns {Promise<void>}
 */
export const clear = async () => {
  try {
    if (isWeb) {
      const keysToClear = [
        "aayucare_auth_token",
        "aayucare_user_data",
        "aayucare_session_data",
        "aayucare_refresh_token",
        "aayucare_language",
      ];
      keysToClear.forEach(removeWebItem);
      return;
    }

    // In a production app, we should track all keys or use a specific storage solution.
    // For AayuCare, these are the critical ones.
    const keysToClear = [
      "aayucare_auth_token",
      "aayucare_user_data",
      "aayucare_session_data",
      "aayucare_refresh_token",
      "aayucare_language",
    ];
    await Promise.all(
      keysToClear.map((key) => SecureStore.deleteItemAsync(key))
    );
  } catch (error) {
    if (__DEV__) {
      console.error("[appStorage] clear error:", error);
    }
    throw error;
  }
};

// Default export as single object
const appStorage = {
  getItem,
  setItem,
  deleteItem,
  clear,
  getItemSync,
};

export default appStorage;
