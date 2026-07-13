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
 * Set item in storage synchronously
 */
export const setItemSync = (key, value) => {
  try {
    if (isWeb) {
      setWebItem(key, value);
      return;
    }
    SecureStore.setItem(key, value);
  } catch (error) {
    if (__DEV__) {
      console.error(`[appStorage] setItemSync error for key "${key}":`, error);
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
 * Remove item from storage synchronously
 */
export const deleteItemSync = (key) => {
  try {
    if (isWeb) {
      removeWebItem(key);
      return;
    }
    SecureStore.deleteItem(key);
  } catch (error) {
    if (__DEV__) {
      console.error(
        `[appStorage] deleteItemSync error for key "${key}":`,
        error
      );
    }
    throw error;
  }
};

/**
 * Remove item from storage (alias)
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export const removeItem = async (key) => {
  return deleteItem(key);
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

/**
 * Get all keys in storage
 * NOTE: SecureStore does NOT support getAllKeys.
 * @returns {Promise<string[]>}
 */
export const getAllKeys = async () => {
  if (isWeb && canUseLocalStorage()) {
    return Object.keys(window.localStorage);
  }

  if (__DEV__) {
    console.warn("[appStorage] getAllKeys is not supported by SecureStore.");
  }
  return [];
};

// Default export as single object
const appStorage = {
  getItem,
  setItem,
  deleteItem,
  removeItem,
  clear,
  getAllKeys,
  getItemSync,
  setItemSync,
  deleteItemSync,
};

export default appStorage;
