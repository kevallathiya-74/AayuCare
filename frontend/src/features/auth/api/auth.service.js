/**
 * AayuCare - Authentication Service
 * Production-grade JWT auth for React Native / Expo
 */

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { APP_CONFIG } from "@/config/appConfig";
import api from "@/services/apiClient";
import logger from '@/utils/logger';
import appStorage from '@/utils/appStorage';
import { STORAGE_KEYS } from '@/utils/constants';

// Better Auth expects base URL WITHOUT /api suffix
const getAuthBaseURL = () => {
  const baseURL = String(APP_CONFIG?.api?.baseURL ?? "").trim();
  if (!baseURL) {
    throw new Error('CRITICAL: No API base URL configured. Set EXPO_PUBLIC_API_BASE_URL.');
  }
  return baseURL.replace(/\/api\/?$/, "");
};

// Create and configure the auth client
export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [
    expoClient({
      scheme: "aayucare",
      storagePrefix: "aayucare_auth",
      storage: {
        getItem: (key) => {
          try {
            return appStorage.getItemSync(key);
          } catch (error) {
            console.error('[Auth] Storage getItem error:', error);
            return null;
          }
        },
        setItem: async (key, value) => {
          try {
             await appStorage.setItem(key, value);
          } catch (error) {
             console.error('[Auth] Storage setItem error:', error);
          }
        },
        removeItem: async (key) => {
          try {
             await appStorage.deleteItem(key);
          } catch (error) {
             console.error('[Auth] Storage removeItem error:', error);
          }
        },
      },
    }),
  ],
});

// Re-export Better Auth methods
export const { signIn, signUp, signOut, useSession, $fetch } = authClient;

// Helper function to check if input is an email
const isEmail = (input) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
};

const normalizeUserProfile = (profile = {}) => {
  const emergencyName =
    profile.emergencyContact?.name ||
    profile.emergencyContactName ||
    profile.emergency_contact_name ||
    null;
  const emergencyPhone =
    profile.emergencyContact?.phone ||
    profile.emergencyContactPhone ||
    profile.emergency_contact_phone ||
    null;

  return {
    ...profile,
    userId: profile.userId || profile.user_id || profile.formatted_user_id,
    hospitalId: profile.hospitalId || profile.hospital_id,
    hospitalName: profile.hospitalName || profile.hospital_name,
    isActive: profile.isActive ?? profile.is_active ?? false,
    isVerified:
      profile.isVerified ??
      profile.emailVerified ??
      profile.email_verified ??
      false,
    dateOfBirth: profile.dateOfBirth || profile.date_of_birth || null,
    bloodGroup: profile.bloodGroup || profile.blood_group || null,
    chronicConditions: profile.chronicConditions || profile.chronic_conditions || [],
    allergies: profile.allergies || [],
    emergencyContactName: emergencyName,
    emergencyContactPhone: emergencyPhone,
    emergencyContact: {
      name: emergencyName,
      phone: emergencyPhone,
      relation:
        profile.emergencyContact?.relation ||
        profile.emergencyContactRelation ||
        profile.emergency_contact_relation ||
        null,
    },
    medicalHistory:
      profile.medicalHistory ||
      profile.medical_history ||
      profile.chronicConditions ||
      profile.chronic_conditions ||
      [],
  };
};

// Fetch with timeout helper
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Server is not responding.');
    }
    throw error;
  }
};

// Additional auth helper functions
export const login = async (credentials) => {
  try {
    const userInput = credentials.userId || credentials.email;
    if (__DEV__) { logger.debug('[auth.service] Login attempt with:', isEmail(userInput) ? 'email' : 'userId'); }
    
    // Validate credentials
    if (!userInput || !credentials.password) {
      throw new Error('Please enter User ID/Email and password exactly as provided.');
    }
    let email = userInput;

    // If input is not an email, convert userId to email
    if (!isEmail(email)) {
      if (__DEV__) { logger.debug('[auth.service] Converting userId to email...'); }
      if (__DEV__) { logger.debug('[auth.service] API URL:', `${APP_CONFIG.api.baseURL}/v1/user/email-by-userid`); }
      
      const emailResponse = await fetchWithTimeout(
        `${APP_CONFIG.api.baseURL}/v1/user/email-by-userid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: email }),
        },
        10000 // 10 second timeout
      );

      if (__DEV__) { logger.debug('[auth.service] Email lookup response status:', emailResponse.status); }

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}));
        if (__DEV__) { console.error('[auth.service] Email lookup failed:', errorData); }
        if (emailResponse.status === 404) {
          throw new Error('Invalid User ID. Enter the exact ID as provided (uppercase/lowercase must match).');
        } else if (emailResponse.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again.');
        }
        
        throw new Error(errorData.message || 'Unable to connect to server');
      }

      const emailData = await emailResponse.json();
      email = emailData.email || emailData.data?.email;
      
      if (!email) {
        throw new Error('Invalid server response. Please try again.');
      }

      if (__DEV__) { logger.debug('[auth.service] Email found for userId'); }
    } else {
      if (__DEV__) { logger.debug('[auth.service] Using email directly for login'); }
    }

    // Sign in using Better Auth with email and password
    if (__DEV__) { logger.debug('[auth.service] Attempting Better Auth sign-in...'); }
    const result = await signIn.email({
      email: email,
      password: credentials.password,
    });

    if (__DEV__) { logger.debug('[auth.service] Better Auth sign-in completed'); }
    if (!result.data?.user) {
      throw new Error('Invalid credentials. Please enter the exact User ID and password.');
    }

    const betterAuthUserId = result.data.user.id;

    // Better Auth sign-in payload token shape may differ from the DB session token
    // used by backend Bearer protection. Use it only as temporary fallback.
    let sessionToken = result.data?.session?.token || result.data?.token || null;
    if (__DEV__) { logger.debug('[auth.service] Session token from sign-in:', sessionToken ? 'exists' : 'missing'); }

    // Build auth headers for subsequent protected requests
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
    };

    // Fetch full user profile with user-friendly data
    if (__DEV__) { logger.debug('[auth.service] Fetching full user profile...'); }
    const profileResponse = await fetchWithTimeout(
      `${APP_CONFIG.api.baseURL}/v1/user/profile-by-email`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ email: email }),
      },
      10000
    );

    if (!profileResponse.ok) {
      if (__DEV__) { console.error('[auth.service] Profile fetch failed', profileResponse.status); }
      throw new Error('Failed to fetch user profile');
    }

    const profileData = await profileResponse.json();
    const normalizedUser = normalizeUserProfile(profileData.data || {});
    if (__DEV__) { logger.debug('[auth.service] Profile fetched for role:', normalizedUser.role); }

    // BLocker: Do not allow deactivated users to login
    if (normalizedUser.isActive === false) {
      await signOut().catch(() => {});
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    // Always exchange credentials for authoritative session token used by protected API middleware
    if (__DEV__) { logger.debug('[auth.service] Exchanging credentials for session token...'); }
    try {
      const sessionResponse = await fetchWithTimeout(
        `${APP_CONFIG.api.baseURL}/v1/user/session-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password: credentials.password,
            userId: betterAuthUserId,
          }),
        },
        8000
      );

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        sessionToken = sessionData.data?.token || sessionData.token || sessionToken;
        if (__DEV__) { logger.debug('[auth.service] Session token exchange successful:', sessionToken ? 'exists' : 'missing'); }
      } else {
        if (__DEV__) { console.warn('[auth.service] Session token exchange returned error status:', sessionResponse.status); }
        if (!sessionToken) {
          throw new Error('Login failed. Please check your exact User ID and password.');
        }
        if (__DEV__) { logger.debug('[auth.service] Using client-side session token fallback'); }
      }
    } catch (sessionError) {
      if (__DEV__) { console.error('[auth.service] Error during session token exchange:', sessionError); }
      if (!sessionToken) {
        throw sessionError;
      }
      if (__DEV__) { logger.debug('[auth.service] Using client-side session token fallback after exception'); }
    }

    // Store session token and user data in appStorage for API interceptor and fast boot
    if (sessionToken) {
      await appStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, sessionToken);
      await appStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(normalizedUser));
      if (__DEV__) { logger.debug('[auth.service] Session token and user data stored in appStorage'); }
    } else {
      if (__DEV__) { console.warn('[auth.service] No session token available - API calls may fail'); }
    }

    if (__DEV__) { logger.debug('[auth.service] Login successful for role:', profileData.data.role); }

    return {
      user: normalizedUser,
      token: sessionToken,
    };
  } catch (error) {
    if (__DEV__) { console.error('[auth.service] Login error:', error.message); }
    if (__DEV__) { console.error('[auth.service] Error details:', error); }
    
    // Re-throw with user-friendly message
    if (error.message.includes('fetch failed') || error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Please ensure:\n1. You have internet connection\n2. Backend server is running');
    }
    
    if (error.message.includes('timeout') || error.message.includes('not responding')) {
      throw new Error('Server is not responding. Please check if the backend is running on Render.');
    }
    
    throw error;
  }
};

export const register = async (userData) => {
  // Validate required fields before calling API
  if (!userData.email || !userData.email.trim()) {
    throw new Error('Email is required');
  }
  if (!userData.password || userData.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  if (!userData.name || !userData.name.trim()) {
    throw new Error('Name is required');
  }

  const result = await signUp.email({
    email: userData.email,
    password: userData.password,
    name: userData.name,
    ...userData,
  });

  // Extract and store session token and user data
  const sessionToken = result.data?.session?.token;
  // Normalize user profile for consistent camelCase shape in Redux
  const rawUser = result.data?.user;
  const normalizedUser = rawUser ? normalizeUserProfile(rawUser) : null;

  if (sessionToken) {
    await appStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, sessionToken);
    if (normalizedUser) {
      await appStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(normalizedUser));
    }
    if (__DEV__) { logger.debug('[auth.service] Registration token and user data stored'); }
  }

  return {
    success: !!rawUser,
    user: normalizedUser,
    token: sessionToken,
  };
};

export const logout = async () => {
  try {
    // Clear token from appStorage
    await appStorage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
    await appStorage.deleteItem(STORAGE_KEYS.USER_DATA);
    if (__DEV__) { logger.debug('[auth.service] Storage cleared'); }

    // Sign out from Better Auth
    await signOut();
    if (__DEV__) { logger.debug('[auth.service] Logout complete'); }
  } catch (error) {
    if (__DEV__) { console.error('[auth.service] Logout error:', error); }
    // Continue even if error - best effort logout
  }
};

const getStartupTimeout = () => {
  const customTimeout = APP_CONFIG.api.timeoutStart || process.env.EXPO_PUBLIC_AUTH_STARTUP_TIMEOUT || process.env.AUTH_STARTUP_TIMEOUT;
  if (customTimeout) return parseInt(customTimeout, 10);
  return __DEV__ ? 3000 : 5000;
};

export const getSession = async () => {
  try {
    if (__DEV__) { logger.debug('[auth.service] Checking for active session...'); }

    // Read the session token we stored in AsyncStorage at login time
    const storedToken = await appStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (!storedToken) {
      if (__DEV__) { logger.debug('[auth.service] No token in AsyncStorage - user must log in'); }
      return null;
    }

    // Try to get cached user profile for fast loading / offline fallback
    const cachedUserJson = await appStorage.getItem(STORAGE_KEYS.USER_DATA);
    let cachedUser = null;
    if (cachedUserJson) {
      try {
        cachedUser = JSON.parse(cachedUserJson);
      } catch (e) {
        if (__DEV__) { console.error('[auth.service] Error parsing cached user profile:', e); }
      }
    }

    const timeout = getStartupTimeout();

    try {
      // Validate the token against the backend using the existing /user/me endpoint
      // (checks the token against the PostgreSQL session table for expiry)
      const validateResponse = await fetchWithTimeout(
        `${APP_CONFIG.api.baseURL}/v1/user/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        },
        timeout
      );

      if (!validateResponse.ok) {
        // ONLY clear session if the server explicitly rejects the token (401 or 403)
        if (validateResponse.status === 401 || validateResponse.status === 403) {
          if (__DEV__) { logger.debug('[auth.service] Stored token is invalid/expired (401/403), clearing storage'); }
          await appStorage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
          await appStorage.deleteItem(STORAGE_KEYS.USER_DATA);
          return null;
        }

        // For other server errors (5xx), fallback to cached user profile if available
        if (cachedUser) {
          if (__DEV__) { logger.debug('[auth.service] Server error, falling back to cached user'); }
          return { user: cachedUser, token: storedToken, isOffline: true };
        }
        return null;
      }

      const sessionData = await validateResponse.json();
      const userProfile = sessionData.data?.user || sessionData.user || null;

      if (!userProfile) {
        if (__DEV__) { logger.debug('[auth.service] Session valid but no user data returned'); }
        return null;
      }

      const normalizedUser = normalizeUserProfile(userProfile);

      // Cache the valid user profile
      await appStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(normalizedUser));

      if (__DEV__) { logger.debug('[auth.service] Session restored and cached for:', normalizedUser.role, normalizedUser.email); }
      return { user: normalizedUser, token: storedToken };
    } catch (networkError) {
      // Catch network error or timeout
      const isTimeout = networkError.message?.includes('timeout') || networkError.message?.includes('not responding');

      if (__DEV__) {
        console.warn(`[auth.service] Network error during session validation (Timeout: ${isTimeout}):`, networkError.message);
      }

      // If we have a cached user profile, return it as a fallback instead of forcing user to log out
      if (cachedUser) {
        if (__DEV__) { logger.debug('[auth.service] Network unreachable, falling back to cached user'); }
        return { user: cachedUser, token: storedToken, isOffline: true, isTimeout };
      }

      return null;
    }
  } catch (error) {
    if (__DEV__) { console.error('[auth.service] getSession critical error:', error?.message || error); }
    return null;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put("/user/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
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
  changePassword,
  authClient,
};

