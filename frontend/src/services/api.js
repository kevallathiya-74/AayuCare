/**
 * AayuCare - API Service Configuration
 * Production-ready Axios instance with interceptors and offline support
 */

import axios from 'axios';
import * as storage from '../utils/secureStorage';
import { STORAGE_KEYS } from '../utils/constants';
import { AppConfig } from '../config/app';
import offlineHandler from '../utils/offlineHandler';

// Create axios instance using centralized configuration
const api = axios.create({
  baseURL: AppConfig.api.baseURL,
  timeout: AppConfig.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API URL for debugging
console.log('[API] API Base URL:', AppConfig.api.baseURL);
console.log('[API] Environment:', AppConfig.env.isDevelopment ? 'Development' : 'Production');
console.log('[API] Expo Go:', AppConfig.env.isExpoGo);

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (__DEV__) {
          console.log(`[TOKEN] Token: ${token.substring(0, 20)}...`);
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
      console.error('[ERROR] Error getting auth token:', error);
      return config;
    }
  },
  (error) => {
    console.error('[ERROR] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints (login, register, refresh)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                           originalRequest.url?.includes('/auth/register') ||
                           originalRequest.url?.includes('/auth/refresh');

    // Handle 401 Unauthorized - Token expired (but not for auth endpoints)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        console.log('[API] 401 error, attempting token refresh...');
        const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (refreshToken) {
          console.log('[API] Refresh token found, calling refresh endpoint');
          const response = await axios.post(`${AppConfig.api.baseURL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data.data;
          console.log('[API] New token received, updating storage');

          // Save new token
          await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          console.log('[API] Retrying original request with new token');
          return api(originalRequest);
        } else {
          console.log('[API] No refresh token found, clearing storage');
          // No refresh token - Clear storage and force re-login
          await storage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
          await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
          await storage.deleteItem(STORAGE_KEYS.USER_DATA);
          
          const authError = new Error('Session expired. Please login again.');
          authError.code = 'AUTH_EXPIRED';
          return Promise.reject(authError);
        }
      } catch (refreshError) {
        console.log('[API] Token refresh failed:', refreshError.message);
        // Refresh failed - Clear storage and redirect to login
        await storage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
        await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
        await storage.deleteItem(STORAGE_KEYS.USER_DATA);

        const authError = new Error('Session expired. Please login again.');
        authError.code = 'AUTH_EXPIRED';
        return Promise.reject(authError);
      }
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Unable to connect to server. Please check your internet connection and try again.');
      console.error('[NETWORK] Network Error');
      console.error('[INFO] Attempted URL:', error.config?.baseURL + error.config?.url);
      console.error('[INFO] API Base URL:', AppConfig.api.baseURL);
      return Promise.reject(networkError);
    }

    // Extract error message from response
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    console.error('[ERROR] API Error:', errorMessage);

    return Promise.reject(new Error(errorMessage));
  }
);

// Test API connectivity (useful for debugging)
export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('[SUCCESS] Backend connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[ERROR] Backend connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced API call wrapper with offline support
 * Automatically queues failed requests when offline
 * @param {Object} config - Axios config object
 * @param {Object} options - Offline handler options
 * @returns {Promise} API response
 */
export const apiCallWithOfflineSupport = async (config, options = {}) => {
  return offlineHandler.executeWithOfflineSupport(
    async () => api(config),
    {
      retryAttempts: options.retryAttempts || 3,
      priority: options.priority || 'normal',
      ...options,
    }
  );
};

export default api;
