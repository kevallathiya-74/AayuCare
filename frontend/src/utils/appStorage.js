/**
 * AayuCare - Secure Application Storage Module
 * Production-grade storage using expo-secure-store.
 */

import * as SecureStore from "expo-secure-store";

export const getItem = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    if (__DEV__) {
      console.error(`[appStorage] getItem error for key "${key}":`, error);
    }
    return null;
  }
};

export const getItemSync = (key) => {
  try {
    return SecureStore.getItem(key);
  } catch (error) {
    if (__DEV__) {
      console.error(`[appStorage] getItemSync error for key "${key}":`, error);
    }
    return null;
  }
};

export const setItem = async (key, value) => {
  try {
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

export const deleteItem = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    if (__DEV__) {
      console.error(`[appStorage] deleteItem error for key "${key}":`, error);
    }
    throw error;
  }
};

export const clear = async () => {
  try {
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

const appStorage = {
  getItem,
  setItem,
  deleteItem,
  clear,
  getItemSync,
};

export default appStorage;
