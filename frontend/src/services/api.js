/**
 * AayuCare - API Service Configuration
 * Production-ready Axios instance with interceptors
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../utils/constants';

// Determine API base URL based on platform
const getBaseURL = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api'; // Android emulator
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:5000/api'; // iOS simulator
    } else {
      return 'http://localhost:5000/api'; // Web
    }
  }
  // Production mode - replace with your production API URL
  return 'https://your-production-api.com/api';
};

// Create axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return config;
    }
  },
  (error) => {
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

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

        if (refreshToken) {
          const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data.data;

          // Save new token
          await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - Clear storage and redirect to login
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);

        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }

    // Extract error message from response
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
