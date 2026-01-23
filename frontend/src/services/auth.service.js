/**
 * AayuCare - Authentication Service
 * Production-grade JWT auth for React Native / Expo
 */

import authService from "./betterAuth.service";

// Re-export all functions
export const {
  register,
  login,
  logout,
  getSession,
  isAuthenticated,
  refreshSession,
  getAuthToken,
  getUserData,
  updateProfile,
  changePassword,
} = authService;

// Legacy function names for compatibility
export const getCurrentUser = async () => {
  const session = await authService.getSession();
  return session ? { user: session.user } : null;
};

export const getStoredUser = authService.getUserData;

export default authService;

