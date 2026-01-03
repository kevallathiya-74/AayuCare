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
    console.log('[authService] Sending register request:', userData.userId, 'hospitalId:', userData.hospitalId);
    const response = await api.post('/auth/register', userData);
    console.log('[authService] Raw register response:', JSON.stringify(response.data, null, 2));
    
    // Extract data from response
    const data = response.data?.data;
    console.log('[authService] Extracted data:', JSON.stringify(data, null, 2));
    
    if (!data) {
      throw new Error('Invalid server response');
    }
    
    const { user, token, refreshToken } = data;
    console.log('[authService] Destructured - user:', user, 'token:', token ? 'exists' : 'missing');
    
    if (!user || !token) {
      throw new Error('Invalid registration response from server');
    }

    // Store tokens and user data securely - wrapped to prevent errors
    try {
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      console.log('[authService] Registration storage complete');
    } catch (storageError) {
      console.log('[authService] Registration storage error:', storageError);
    }

    console.log('[authService] Returning:', { user, token: token ? 'exists' : 'missing', refreshToken: refreshToken ? 'exists' : 'missing' });
    return { user, token, refreshToken };
  } catch (error) {
    console.log('[authService] Register error:', error);
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
    console.log('[authService] Sending login request:', credentials.userId);
    const response = await api.post('/auth/login', credentials);
    console.log('[authService] Raw response:', JSON.stringify(response.data, null, 2));
    
    // Extract data from response
    const data = response.data?.data;
    console.log('[authService] Extracted data:', JSON.stringify(data, null, 2));
    
    if (!data) {
      throw new Error('Invalid server response');
    }
    
    const { user, token, refreshToken } = data;
    console.log('[authService] Destructured - user:', user, 'token:', token ? 'exists' : 'missing');
    
    if (!user || !token) {
      throw new Error('Invalid login response from server');
    }

    // Store tokens and user data securely - wrapped to prevent errors
    try {
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      console.log('[authService] Storage complete');
    } catch (storageError) {
      console.log('[authService] Storage error:', storageError);
    }

    console.log('[authService] Returning:', { user, token: token ? 'exists' : 'missing', refreshToken: refreshToken ? 'exists' : 'missing' });
    return { user, token, refreshToken };
  } catch (error) {
    console.log('[authService] Login error:', error);
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
    console.log('[authService] Calling logout endpoint');
    await api.post('/auth/logout');
    console.log('[authService] Logout endpoint successful');
  } catch (error) {
    console.log('[authService] Logout endpoint error (continuing):', error);
    // Continue with local logout even if API call fails
  }

  // Clear local storage - wrapped in try-catch to prevent errors
  try {
    await storage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.deleteItem(STORAGE_KEYS.USER_DATA);
    console.log('[authService] Storage cleared');
  } catch (error) {
    console.log('[authService] Storage clear error:', error);
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
    console.log('[authService] isAuthenticated check:', token ? 'has token' : 'no token');
    return !!token;
  } catch (error) {
    console.log('[authService] isAuthenticated error:', error);
    return false;
  }
};

/**
 * Get stored user data
 */
export const getStoredUser = async () => {
  try {
    const userData = await storage.getItem(STORAGE_KEYS.USER_DATA);
    const user = userData ? JSON.parse(userData) : null;
    console.log('[authService] getStoredUser:', user?.userId || 'no user');
    return user;
  } catch (error) {
    console.log('[authService] getStoredUser error:', error);
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
