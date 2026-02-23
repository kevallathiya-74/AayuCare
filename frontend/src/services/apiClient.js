/**
 * AayuCare - API Service Configuration
 * Production-ready Axios instance with interceptors and offline support
 */

import axios from 'axios';
import appStorage from '../utils/appStorage';
import { STORAGE_KEYS } from '../utils/constants';
import { APP_CONFIG } from '../config/appConfig';

// Runtime guard: Ensure appStorage is properly wired
if (!appStorage || typeof appStorage.getItem !== 'function') {
  if (__DEV__) {
    console.error('[API] CRITICAL: appStorage module not properly loaded!');
    console.error('[API] appStorage:', appStorage);
  }
  throw new Error('appStorage module is not properly initialized');
}

// Create axios instance using centralized configuration
const api = axios.create({
  baseURL: APP_CONFIG.api.baseURL,
  timeout: APP_CONFIG.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API URL for debugging (dev only)
if (__DEV__) {
  console.log('[API] API Base URL:', APP_CONFIG.api.baseURL);
  console.log('[API] Environment:', APP_CONFIG.env.isDevelopment ? 'Development' : 'Production');
  console.log('[API] Expo Go:', APP_CONFIG.env.isExpoGo);
}

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await appStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (__DEV__) {
          console.log('[TOKEN] Authorization header set');
        }
      } else {
        if (__DEV__) {
          console.log('⚠️ No auth token found in storage');
        }
      }

      if (__DEV__) {
        console.log(`[REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    } catch (error) {
      if (__DEV__) {
        console.error('[ERROR] Error getting auth token:', error);
      }
      return config;
    }
  },
  (error) => {
    if (__DEV__) {
      console.error('[ERROR] Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints (login, register)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/sign-in') || 
                           originalRequest.url?.includes('/auth/sign-up') ||
                           originalRequest.url?.includes('/auth/refresh');

    // Handle 401 Unauthorized - Session expired (Better Auth uses session tokens, not refresh tokens)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (__DEV__) {
        console.log('[API] 401 error - Session expired, clearing storage');
      }
      
      // Better Auth doesn't use refresh tokens - session is managed server-side
      // Clear storage and force re-login
      await appStorage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
      await appStorage.deleteItem(STORAGE_KEYS.USER_DATA);

      // Dispatch logout to Redux so UI state is also cleared
      try {
        const store = require('../store/store').default;
        const { logoutUser } = require('../store/slices/authSlice');
        store.dispatch(logoutUser());
      } catch (storeErr) {
        if (__DEV__) {
          console.warn('[API] Could not dispatch logoutUser to Redux store:', storeErr);
        }
      }
      
      const authError = new Error('Session expired. Please login again.');
      authError.code = 'AUTH_EXPIRED';
      return Promise.reject(authError);
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Unable to connect to server. Please check your internet connection and try again.');
      if (__DEV__) {
        console.error('[NETWORK] Network Error');
        console.error('[INFO] Attempted URL:', error.config?.baseURL + error.config?.url);
        console.error('[INFO] API Base URL:', APP_CONFIG.api.baseURL);
      }
      return Promise.reject(networkError);
    }

    // Extract error message from response
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An error occurred';
    if (__DEV__) {
      console.error('[ERROR] API Error:', errorMessage);
    }

    return Promise.reject(new Error(errorMessage));
  }
);

// Test API connectivity (useful for debugging)
export default api;

