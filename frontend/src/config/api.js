import axios from 'axios';
import { Platform } from 'react-native';

// Use your computer's local IP address for mobile devices
// For web, use localhost
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // Replace with your computer's IP address (from ipconfig or Expo metro URL)
  // Example: If Expo shows exp://10.9.15.29:8081, use http://10.9.15.29:5000/api
  return 'http://10.9.15.29:5000/api';
};

export const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

export default api;
