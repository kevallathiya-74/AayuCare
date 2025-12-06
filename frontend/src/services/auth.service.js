/**
 * AayuCare - Authentication Service
 * Connects to real backend API with role-based authentication
 */

import api from './api';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Register new user (Admin, Doctor, Patient, or User)
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    const { user, token, refreshToken } = response.data.data;

    // Store tokens and user data securely
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Login user with userId and password
 * Supports all roles: admin, doctor, patient, user
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { user, token, refreshToken } = response.data.data;

    // Store tokens and user data securely
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return response.data.data;
  } catch (error) {
    throw error;
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
    console.error('Logout API error:', error);
  } finally {
    // Clear local storage
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
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
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return response.data.data;
  } catch (error) {
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.data.user));

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
  updateProfile,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  isAuthenticated,
  getStoredUser,
};
