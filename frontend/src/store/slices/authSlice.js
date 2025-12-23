/**
 * AayuCare - Auth Redux Slice
 * 
 * Manages authentication state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/auth.service';

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
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('[authSlice] Login thunk started with:', credentials.userId);
      const response = await authService.login(credentials);
      console.log('[authSlice] Login response:', JSON.stringify(response, null, 2));
      console.log('[authSlice] User:', response?.user);
      console.log('[authSlice] Token:', response?.token ? 'exists' : 'missing');
      return response;
    } catch (error) {
      console.log('[authSlice] Login error:', error);
      // Error is already a string message from auth service
      return rejectWithValue(error || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('[authSlice] Register thunk started with:', userData.userId);
      const response = await authService.register(userData);
      console.log('[authSlice] Register response:', JSON.stringify(response, null, 2));
      console.log('[authSlice] User:', response?.user);
      console.log('[authSlice] Token:', response?.token ? 'exists' : 'missing');
      return response;
    } catch (error) {
      console.log('[authSlice] Register error:', error);
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[authSlice] Logout thunk started');
      await authService.logout();
      console.log('[authSlice] Logout complete');
      return null;
    } catch (error) {
      console.log('[authSlice] Logout error:', error);
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[authSlice] Load user thunk started');
      const isAuth = await authService.isAuthenticated();
      console.log('[authSlice] isAuthenticated:', isAuth);
      if (!isAuth) {
        console.log('[authSlice] No auth token found');
        return null;
      }
      
      // Verify token is valid by making an API call
      try {
        console.log('[authSlice] Verifying token with API call');
        const response = await authService.getCurrentUser();
        console.log('[authSlice] Token verified, user data received:', response.user?.userId);
        return response.user;
      } catch (error) {
        console.log('[authSlice] Token verification failed:', error.message);
        // Token is invalid - clear storage and return null
        await authService.logout();
        return null;
      }
    } catch (error) {
      console.log('[authSlice] Load user error:', error);
      return rejectWithValue(error.message || 'Failed to load user');
    }
  }
);

export const refreshUserData = createAsyncThunk(
  'auth/refreshUserData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response.user;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to refresh user data');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
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
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('[authSlice] loginUser.fulfilled - payload:', JSON.stringify(action.payload, null, 2));
        console.log('[authSlice] Setting user:', action.payload?.user);
        console.log('[authSlice] Setting token:', action.payload?.token ? 'exists' : 'missing');
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        console.log('[authSlice] State after update:', { 
          isAuthenticated: state.isAuthenticated, 
          hasUser: !!state.user, 
          hasToken: !!state.token 
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
    
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        console.log('[authSlice] registerUser.fulfilled - payload:', JSON.stringify(action.payload, null, 2));
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        console.log('[authSlice] Register state updated:', { 
          isAuthenticated: state.isAuthenticated, 
          hasUser: !!state.user, 
          hasToken: !!state.token 
        });
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
    
    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('[authSlice] logoutUser.fulfilled - clearing state');
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
        console.log('[authSlice] Logout state cleared');
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        // Still clear user data even if logout API fails
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
    
    // Load user
    builder
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        console.log('[authSlice] loadUser.fulfilled - payload:', action.payload?.userId);
        state.isLoading = false;
        if (action.payload) {
          console.log('[authSlice] Setting authenticated user:', action.payload.userId);
          state.isAuthenticated = true;
          state.user = action.payload;
        } else {
          console.log('[authSlice] No user data found');
          state.isAuthenticated = false;
          state.user = null;
        }
        console.log('[authSlice] LoadUser state:', { 
          isAuthenticated: state.isAuthenticated, 
          hasUser: !!state.user 
        });
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      });
    
    // Refresh user data
    builder
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, updateUser, setUser, setToken } = authSlice.actions;

export default authSlice.reducer;
