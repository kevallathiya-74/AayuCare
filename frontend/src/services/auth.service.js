/**
 * AayuCare - Authentication Service
 * 
 * Handles all authentication-related API calls.
 */

import api from './api';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Register new user
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Login user
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { token, refreshToken, user } = response.data;
    
    // Store tokens and user data securely
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    // Call logout endpoint (optional, for server-side cleanup)
    await api.post('/auth/logout');
  } catch (error) {
    // Continue with local logout even if API call fails
  } finally {
    // Clear local storage
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  }
};

/**
 * Send OTP for phone verification
 */
export const sendOTP = async (phone) => {
  try {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (phone, otp) => {
  try {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (phoneOrEmail) => {
  try {
    const response = await api.post('/auth/forgot-password', { phoneOrEmail });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Reset password
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Change password (when logged in)
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    
    // Update stored user data
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = async () => {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
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
    const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

export default {
  register,
  login,
  logout,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  isAuthenticated,
  getStoredUser,
};
