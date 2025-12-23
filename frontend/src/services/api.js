/**
 * AayuCare - API Service Configuration
 * Production-ready Axios instance with interceptors and offline support
 */

import axios from 'axios';
import * as storage from '../utils/secureStorage';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../utils/constants';
import Constants from 'expo-constants';
import offlineHandler from '../utils/offlineHandler';

// Determine API base URL based on platform
const getBaseURL = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'web') {
      return 'http://localhost:5000/api';
    }
    
    // For mobile (Android/iOS)
    // IMPORTANT: Tunnel mode only works for frontend, not backend!
    // We need to use a fixed IP or ngrok for backend
    
    const debuggerHost = Constants.expoConfig?.hostUri || 
                        Constants.manifest?.debuggerHost ||
                        Constants.manifest2?.extra?.expoGo?.debuggerHost;
    
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      
      // Check if using Expo tunnel (contains exp.direct or ngrok)
      if (host.includes('exp.direct') || host.includes('ngrok') || host.includes('expo.dev')) {
        // Expo tunnel doesn't expose backend!
        // Use ngrok URL if set, otherwise fallback to local IP
        const ngrokUrl = Constants.expoConfig?.extra?.backendUrl;
        
        if (ngrokUrl) {
          console.log('🌐 Using ngrok backend:', ngrokUrl);
          return ngrokUrl;
        }
        
        // Fallback: Use computer's local IP (change this to your IP)
        const fallbackIP = '10.9.15.29'; // ✅ Updated to current IP
        console.warn('⚠️ Tunnel mode: Using fallback IP for backend:', fallbackIP);
        return `http://${fallbackIP}:5000/api`;
      }
      
      // LAN mode - use detected IP
      return `http://${host}:5000/api`;
    }
    
    // Fallback
    console.warn('Could not detect debugger host, using localhost');
    return 'http://localhost:5000/api';
  }
  
  // Production mode
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

// Log API URL in development
if (__DEV__) {
  console.log('📡 API Base URL:', api.defaults.baseURL);
  console.log('📱 Platform:', Platform.OS);
  console.log('🔧 Debug Host:', Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || 'Not available');
}

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (__DEV__) {
          console.log(`🔑 Token: ${token.substring(0, 20)}...`);
        }
      } else {
        if (__DEV__) {
          console.log('⚠️ No auth token found in storage');
        }
      }

      if (__DEV__) {
        console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
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
        console.log('[API] 401 error, attempting token refresh...');
        const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (refreshToken) {
          console.log('[API] Refresh token found, calling refresh endpoint');
          const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
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
      const debugHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || 'unknown';
      const isTunnel = debugHost.includes('ngrok') || debugHost.includes('exp.direct') || debugHost.includes('expo.dev');
      
      let errorMsg = 'Cannot connect to server. Please check:\n';
      
      if (isTunnel) {
        errorMsg += '1. Backend server is running\n';
        errorMsg += '2. Tunnel connection is active\n';
        errorMsg += '3. Wait a moment and try again';
      } else {
        errorMsg += '1. Backend server is running\n';
        errorMsg += '2. Phone and computer are on same WiFi\n';
        errorMsg += '3. Firewall allows port 5000\n';
        errorMsg += '\nTIP: Use tunnel mode if on different networks:\n';
        errorMsg += 'Run: npm run start:tunnel';
      }
      
      const networkError = new Error(errorMsg);
      console.error('❌ Network Error:', networkError.message);
      console.error('🔍 Attempted URL:', error.config?.baseURL + error.config?.url);
      console.error('🌐 Debug Host:', debugHost);
      return Promise.reject(networkError);
    }

    // Extract error message from response
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    console.error('❌ API Error:', errorMessage);

    return Promise.reject(new Error(errorMessage));
  }
);

// Test API connectivity (useful for debugging)
export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ Backend connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
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
