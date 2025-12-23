/**
 * AayuCare - Auth Interceptor Setup
 * Sets up axios interceptor to handle authentication errors globally
 */

import api from '../services/api';
import * as storage from './secureStorage';
import { STORAGE_KEYS } from './constants';

let store;

/**
 * Initialize auth interceptor with Redux store
 * Call this once during app initialization
 */
export const setupAuthInterceptor = (reduxStore) => {
  store = reduxStore;
  console.log('[authInterceptor] Initialized with Redux store');
};

/**
 * Handle auth error - clear storage and logout
 * This is called from the API interceptor when auth fails
 */
export const handleAuthError = async () => {
  console.log('[authInterceptor] Handling auth error - clearing storage');
  
  // Clear all auth data from storage
  await storage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
  await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
  await storage.deleteItem(STORAGE_KEYS.USER_DATA);
  
  // Dispatch logout action to clear Redux state
  if (store) {
    const { logoutUser } = require('../store/slices/authSlice');
    store.dispatch(logoutUser());
  }
};
