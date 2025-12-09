/**
 * AayuCare - Authentication Service
 * Connects to real backend API with role-based authentication
 */

import api from './api';
import * as storage from '../utils/secureStorage';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Register new user (Admin, Doctor, Patient, or User)
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    // Extract data from response
    const data = response.data?.data;
    
    if (!data) {
      throw new Error('Invalid server response');
    }
    
    const { user, token, refreshToken } = data;
    
    if (!user || !token) {
      throw new Error('Invalid registration response from server');
    }

    // Store tokens and user data securely - wrapped to prevent errors
    try {
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (storageError) {
      // Storage error handled silently
    }

    return { user, token, refreshToken };
  } catch (error) {
    // Extract clean error message
    const message = error.response?.data?.message || error.message || 'Registration failed';
    throw message;
  }
};

/**
 * Login user with userId and password
 * Supports all roles: admin, doctor, patient, user
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Extract data from response
    const data = response.data?.data;
    
    if (!data) {
      throw new Error('Invalid server response');
    }
    
    const { user, token, refreshToken } = data;
    
    if (!user || !token) {
      throw new Error('Invalid login response from server');
    }

    // Store tokens and user data securely - wrapped to prevent errors
    try {
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (storageError) {
    }

    return { user, token, refreshToken };
  } catch (error) {
    // Extract specific error message from backend
    // Backend sends specific messages like "Incorrect User ID" or "Incorrect Password"
    const message = error.response?.data?.message || 
                   error.response?.data?.error ||
                   error.message || 
                   'Login failed';
    throw message;
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    // Call logout endpoint
    await api.post('/auth/logout');
  } catch (error) {
    // Continue with local logout even if API call fails
  }

  // Clear local storage - wrapped in try-catch to prevent errors
  try {
    await storage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.deleteItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    // Silently handle storage errors
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    const { user } = response.data.data;

    // Update stored user data
    await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');

    // Update stored user data
    await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.data.user));

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = async () => {
  try {
    const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
  } catch (error) {
    return false;
  }
};

/**
 * Get stored user data
 */
export const getStoredUser = async () => {
  try {
    const userData = await storage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

export default {
  register,
  login,
  logout,
  updateProfile,
  getCurrentUser,
  isAuthenticated,
  getStoredUser,
};
