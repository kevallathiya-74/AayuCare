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
import * as authService from "../../services/auth.service";

// Runtime guard: Prevent accidental 'storage' references
if (typeof storage !== 'undefined' && typeof window === 'undefined') {
  console.warn('[authSlice] WARNING: Global "storage" detected in React Native context. This should NOT exist.');
}

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
      console.log("[authSlice] Login thunk started with:", credentials.userId);
      const response = await authService.login(credentials);
      console.log(
        "[authSlice] Login response:",
        JSON.stringify(response, null, 2)
      );
      console.log("[authSlice] User:", response?.user);
      console.log("[authSlice] Token:", response?.token ? "exists" : "missing");
      return response;
    } catch (error) {
      console.error("[authSlice] Login error:", error);
      const errorMessage =
        error?.message || error?.toString() || "Login failed";
      console.error("[authSlice] Error message:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      console.log("[authSlice] Logout thunk started");
      await authService.logout();
      console.log("[authSlice] Logout complete");
      return null;
    } catch (error) {
      console.log("[authSlice] Logout error:", error);
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      console.log("[authSlice] Load user thunk started");

      // Get session from local storage (instant, no network call)
      const session = await authService.getSession();

      if (!session || !session.user) {
        console.log(
          "[authSlice] No valid session found - user not authenticated"
        );
        return null;
      }

      console.log(
        "[authSlice] User loaded from session:",
        session.user.id || session.user.email
      );
      return session.user;
    } catch (error) {
      console.error("[authSlice] Load user error:", error?.message || error);
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
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUser, setUser, setToken } = authSlice.actions;

export default authSlice.reducer;

