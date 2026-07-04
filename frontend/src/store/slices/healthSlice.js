/**
 * AayuCare - Health Redux Slice
 * 
 * Manages health records and vitals state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { healthMetricsService } from '@/services';

// Thunks
export const fetchHealthMetrics = createAsyncThunk(
  'health/fetchMetrics',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await healthMetricsService.getMetrics(patientId);
      return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch health metrics');
    }
  }
);

// Initial state
const initialState = {
  vitals: [],
  isLoading: false,
  error: null,
};

// Create the slice
const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthMetrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHealthMetrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vitals = action.payload; // Storing metrics here
      })
      .addCase(fetchHealthMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = healthSlice.actions;

export default healthSlice.reducer;

