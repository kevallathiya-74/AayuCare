/**
 * AayuCare - Auth Redux Slice
 *
 * Manages authentication state.
 * 
 * ARCHITECTURE NOTE:
 * - This slice does NOT use 'storage' directly
 * - Redux Toolkit does NOT provide 'storage' by default
 * - All storage operations go through authService abstraction
 * - authService uses Better Auth with SecureStore
 * - NO thunkExtraArgument configuration needed
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from '@/features/auth/api/auth.service';
import logger from '@/utils/logger';
import appStorage from '@/utils/appStorage';
import { STORAGE_KEYS } from '@/utils/constants';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      logger.debug("authSlice", "Login thunk started", { userId: credentials.userId });
      const response = await authService.login(credentials);
      logger.debug("authSlice", "Login response received", {
        hasUser: !!response?.user,
        hasToken: !!response?.token,
      });
      return response;
    } catch (error) {
      logger.error("authSlice", "Login error", error?.message || error);
      const errorMessage =
        error?.message || error?.toString() || "Login failed";
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      logger.debug("authSlice", "Logout thunk started");
      await authService.logout();
      logger.debug("authSlice", "Logout complete");
      return null;
    } catch (error) {
      logger.error("authSlice", "Logout error", error?.message || error);
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);

export const validateSessionBackground = createAsyncThunk(
  "auth/validateSessionBackground",
  async ({ token: _token }, { dispatch }) => {
    try {
      logger.debug("authSlice", "Background session validation started");
      const session = await authService.getSession();
      
      if (!session || !session.user) {
        logger.warn("authSlice", "Background validation failed - invalid/expired session. Logging out.");
        dispatch(logoutUser());
        return null;
      }
      
      logger.debug("authSlice", "Background validation successful", { id: session.user.id });
      return { user: session.user, token: session.token };
    } catch (error) {
      logger.warn("authSlice", "Background validation failed (network/timeout). Keeping cached session.", error?.message || error);
      return null;
    }
  }
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { dispatch, rejectWithValue: _rejectWithValue }) => {
    try {
      logger.debug("authSlice", "Load user thunk started");

      // 1. Fast path: load cached user profile and token from local storage
      const storedToken = await appStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const cachedUserJson = await appStorage.getItem(STORAGE_KEYS.USER_DATA);

      let cachedUser = null;
      if (cachedUserJson) {
        try {
          cachedUser = JSON.parse(cachedUserJson);
        } catch (e) {
          logger.error("authSlice", "Error parsing cached user profile:", e);
        }
      }

      if (storedToken && cachedUser) {
        logger.debug("authSlice", "Fast-loaded user from cache, bypassing splash wait", { id: cachedUser.id });
        
        // Dispatch background validation thunk
        dispatch(validateSessionBackground({ token: storedToken }));
        
        return { user: cachedUser, token: storedToken };
      }

      // 2. Slow path/No cache: validate stored token against backend
      const session = await authService.getSession();

      if (!session || !session.user) {
        logger.debug("authSlice", "No valid session found - user not authenticated");
        return null;
      }

      logger.debug("authSlice", "User loaded from session", { id: session.user.id });
      // Return both user and token so the reducer can restore full state
      return { user: session.user, token: session.token || null };
    } catch (error) {
      logger.error("authSlice", "Load user error", error?.message || error);
      // Always return null instead of rejecting - allows app to continue
      return null;
    }
  }
);

// Create the slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload?.user || null;
        state.token = action.payload?.token || null;
        state.isAuthenticated = !!action.payload?.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // Load user
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.user) {
          state.user = action.payload.user;
          state.token = action.payload.token || null;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Background validation
      .addCase(validateSessionBackground.fulfilled, (state, action) => {
        if (action.payload?.user) {
          state.user = action.payload.user;
          state.token = action.payload.token || null;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { clearError, updateUser, setUser, setToken } = authSlice.actions;

export default authSlice.reducer;

