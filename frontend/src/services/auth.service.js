/**
 * AayuCare - Authentication Service
 * Production-grade JWT auth for React Native / Expo
 */

import authClient from "./betterAuth.service";

// Re-export Better Auth methods
export const { signIn, signUp, signOut, useSession } = authClient;

// Additional auth helper functions
export const login = async (credentials) => {
  const result = await signIn.email({
    email: credentials.email,
    password: credentials.password,
  });
  return {
    user: result.data?.user,
    token: result.data?.session?.token,
  };
};

export const register = async (userData) => {
  const result = await signUp.email({
    email: userData.email,
    password: userData.password,
    name: userData.name,
    ...userData,
  });
  return {
    success: !!result.data?.user,
    user: result.data?.user,
    token: result.data?.session?.token,
  };
};

export const logout = async () => {
  await signOut();
};

export const getSession = async () => {
  // Use Better Auth's session hook or method
  const session = authClient.$fetch('/api/auth/get-session');
  return session;
};

// Export service object as default for consistent usage
export default {
  signIn,
  signUp,
  signOut,
  useSession,
  login,
  register,
  logout,
  getSession,
  authClient,
};

