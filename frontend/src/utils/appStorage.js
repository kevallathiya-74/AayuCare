/**
 * AayuCare - Application Storage Module
 * 
 * Uniquely named to avoid shadowing/conflicts with browser globals or packages
 * Backed by AsyncStorage (React Native standard)
 * 
 * WHY "appStorage" NOT "storage":
 * - Avoids conflicts with browser Storage API
 * - Prevents shadowing by bundler/polyfills
 * - Clear, unambiguous module identity
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get item from storage
 * @param {string} key - Storage key
 * @returns {Promise<string|null>} Stored value or null
 */
export const getItem = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    console.error(`[appStorage] getItem error for key "${key}":`, error);
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
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`[appStorage] setItem error for key "${key}":`, error);
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
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[appStorage] deleteItem error for key "${key}":`, error);
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
 * @returns {Promise<void>}
 */
export const clear = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('[appStorage] clear error:', error);
    throw error;
  }
};

/**
 * Get all keys in storage
 * @returns {Promise<string[]>}
 */
export const getAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  } catch (error) {
    console.error('[appStorage] getAllKeys error:', error);
    return [];
  }
};

// Default export as single object
const appStorage = {
  getItem,
  setItem,
  deleteItem,
  removeItem,
  clear,
  getAllKeys,
};

// Runtime validation
if (typeof appStorage.getItem !== 'function') {
  throw new Error('[appStorage] CRITICAL: getItem is not a function - module initialization failed');
}

export default appStorage;
