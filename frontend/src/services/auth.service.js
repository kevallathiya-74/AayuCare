/**
 * AayuCare - Authentication Service
 * Now using Better Auth for modern, secure authentication
 * Maintains backwards compatibility with existing code
 */

// Import and re-export Better Auth service
import betterAuthService from "./betterAuth.service";

// Re-export all functions for backwards compatibility
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
  authClient,
} = betterAuthService;

// Also export legacy function names for compatibility
export const getCurrentUser = async () => {
  const session = await betterAuthService.getSession();
  return session ? { user: session.user } : null;
};

export const getStoredUser = betterAuthService.getUserData;

// Export default
export default betterAuthService;
