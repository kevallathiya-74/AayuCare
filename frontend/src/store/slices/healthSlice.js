/**
 * AayuCare - Health Redux Slice
 * 
 * Manages health records and vitals state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
  healthRecords: [],
  vitals: [],
  prescriptions: [],
  selectedRecord: null,
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
    setSelectedRecord: (state, action) => {
      state.selectedRecord = action.payload;
    },
    clearSelectedRecord: (state) => {
      state.selectedRecord = null;
    },
  },
});

export const { clearError, setSelectedRecord, clearSelectedRecord } = healthSlice.actions;

export default healthSlice.reducer;

