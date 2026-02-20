/**
 * AayuCare - Authentication Service
 * Production-grade JWT auth for React Native / Expo
 */

import authClient from "./betterAuth.service";
import { APP_CONFIG } from "../config/appConfig";
import api from "./apiClient";

// Re-export Better Auth methods
export const { signIn, signUp, signOut, useSession } = authClient;

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
    console.log('[auth.service] Login attempt with:', isEmail(userInput) ? 'email' : 'userId');
    
    // Validate credentials
    if (!userInput || !credentials.password) {
      throw new Error('Please enter both User ID/Email and Password');
    }

    let email = userInput.trim();

    // If input is not an email, convert userId to email
    if (!isEmail(email)) {
      console.log('[auth.service] Converting userId to email...');
      console.log('[auth.service] API URL:', `${APP_CONFIG.api.baseURL}/user/email-by-userid`);
      
      const emailResponse = await fetchWithTimeout(
        `${APP_CONFIG.api.baseURL}/user/email-by-userid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: email }),
        },
        10000 // 10 second timeout
      );

      console.log('[auth.service] Email lookup response status:', emailResponse.status);

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}));
        console.error('[auth.service] Email lookup failed:', errorData);
        
        if (emailResponse.status === 404) {
          throw new Error('User ID not found.');
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

      console.log('[auth.service] Email found for userId');
    } else {
      console.log('[auth.service] Using email directly for login');
    }

    // Sign in using Better Auth with email and password
    console.log('[auth.service] Attempting Better Auth sign-in...');
    const result = await signIn.email({
      email: email,
      password: credentials.password,
    });

    console.log('[auth.service] Better Auth sign-in completed');

    if (!result.data?.user) {
      throw new Error('Invalid email/password combination.');
    }

    const betterAuthUserId = result.data.user.id;

    // Fetch full user profile with user-friendly data
    console.log('[auth.service] Fetching full user profile...');
    const profileResponse = await fetchWithTimeout(
      `${APP_CONFIG.api.baseURL}/user/profile-by-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
      },
      10000
    );

    if (!profileResponse.ok) {
      console.error('[auth.service] Profile fetch failed');
      throw new Error('Failed to fetch user profile');
    }

    const profileData = await profileResponse.json();
    const normalizedUser = normalizeUserProfile(profileData.data || {});
    console.log('[auth.service] Profile fetched for role:', normalizedUser.role);

    // Fetch the session token from backend
    console.log('[auth.service] Fetching session token...');
    let sessionToken = null;
    try {
      const sessionResponse = await fetchWithTimeout(
        `${APP_CONFIG.api.baseURL}/user/current-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: betterAuthUserId }),
        },
        5000
      );

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        sessionToken = sessionData.token;
        console.log('[auth.service] Session token retrieved:', sessionToken ? 'exists' : 'missing');
      } else {
        console.warn('[auth.service] Session fetch failed:', sessionResponse.status);
      }
    } catch (sessionError) {
      console.error('[auth.service] Error fetching session:', sessionError);
    }

    // Store session token in appStorage for API interceptor
    if (sessionToken) {
      const appStorage = (await import('../utils/appStorage')).default;
      const { STORAGE_KEYS } = await import('../utils/constants');
      await appStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, sessionToken);
      console.log('[auth.service] Session token stored in appStorage');
    } else {
      console.warn('[auth.service] No session token available - API calls may fail');
    }

    console.log('[auth.service] Login successful for role:', profileData.data.role);

    return {
      user: normalizedUser,
      token: sessionToken,
    };
  } catch (error) {
    console.error('[auth.service] Login error:', error.message);
    console.error('[auth.service] Error details:', error);
    
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
  const result = await signUp.email({
    email: userData.email,
    password: userData.password,
    name: userData.name,
    ...userData,
  });

  // Extract and store session token
  const sessionToken = result.data?.session?.token;
  if (sessionToken) {
    const appStorage = (await import('../utils/appStorage')).default;
    const { STORAGE_KEYS } = await import('../utils/constants');
    await appStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, sessionToken);
    console.log('[auth.service] Registration token stored');
  }

  return {
    success: !!result.data?.user,
    user: result.data?.user,
    token: sessionToken,
  };
};

export const logout = async () => {
  try {
    // Clear token from appStorage
    const appStorage = (await import('../utils/appStorage')).default;
    const { STORAGE_KEYS } = await import('../utils/constants');
    await appStorage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
    await appStorage.deleteItem(STORAGE_KEYS.USER_DATA);
    console.log('[auth.service] Storage cleared');

    // Sign out from Better Auth
    await signOut();
    console.log('[auth.service] Logout complete');
  } catch (error) {
    console.error('[auth.service] Logout error:', error);
    // Continue even if error - best effort logout
  }
};

export const getSession = async () => {
  try {
    console.log('[auth.service] Checking for active session...');
    
    // Better Auth expo client doesn't expose a direct getSession() method
    // Sessions are managed internally by the auth client after successful login
    // The session token is stored in SecureStore automatically
    
    // TODO: Implement session persistence
    // For now, users must log in each time they open the app
    // To persist sessions, we need to:
    // 1. Store session token after login
    // 2. Validate token on app startup
    // 3. Restore user data if token is valid
    
    console.log('[auth.service] No active session - user needs to log in');
    return null;
    
  } catch (error) {
    console.error('[auth.service] getSession error:', error);
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

