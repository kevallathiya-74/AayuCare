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

// Async thunks

export const fetchHealthRecords = createAsyncThunk(
  'health/fetchHealthRecords',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/health/records', { params: filters });
      return response.data.records;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch health records');
    }
  }
);

export const addHealthRecord = createAsyncThunk(
  'health/addHealthRecord',
  async (recordData, { rejectWithValue }) => {
    try {
      const response = await api.post('/health/records', recordData);
      return response.data.record;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add health record');
    }
  }
);

export const updateHealthRecord = createAsyncThunk(
  'health/updateHealthRecord',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/health/records/${id}`, data);
      return response.data.record;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update health record');
    }
  }
);

export const deleteHealthRecord = createAsyncThunk(
  'health/deleteHealthRecord',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/health/records/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete health record');
    }
  }
);

export const fetchVitals = createAsyncThunk(
  'health/fetchVitals',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/health/vitals', { params: filters });
      return response.data.vitals;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vitals');
    }
  }
);

export const addVitals = createAsyncThunk(
  'health/addVitals',
  async (vitalsData, { rejectWithValue }) => {
    try {
      const response = await api.post('/health/vitals', vitalsData);
      return response.data.vitals;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add vitals');
    }
  }
);

export const fetchPrescriptions = createAsyncThunk(
  'health/fetchPrescriptions',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/health/prescriptions', { params: filters });
      return response.data.prescriptions;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch prescriptions');
    }
  }
);

// Slice
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
  extraReducers: (builder) => {
    // Fetch health records
    builder
      .addCase(fetchHealthRecords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHealthRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.healthRecords = action.payload;
        state.error = null;
      })
      .addCase(fetchHealthRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Add health record
    builder
      .addCase(addHealthRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addHealthRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.healthRecords.unshift(action.payload);
        state.error = null;
      })
      .addCase(addHealthRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Update health record
    builder
      .addCase(updateHealthRecord.fulfilled, (state, action) => {
        const index = state.healthRecords.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.healthRecords[index] = action.payload;
        }
        state.selectedRecord = action.payload;
      });
    
    // Delete health record
    builder
      .addCase(deleteHealthRecord.fulfilled, (state, action) => {
        state.healthRecords = state.healthRecords.filter(r => r.id !== action.payload);
        if (state.selectedRecord?.id === action.payload) {
          state.selectedRecord = null;
        }
      });
    
    // Fetch vitals
    builder
      .addCase(fetchVitals.fulfilled, (state, action) => {
        state.vitals = action.payload;
      });
    
    // Add vitals
    builder
      .addCase(addVitals.fulfilled, (state, action) => {
        state.vitals.unshift(action.payload);
      });
    
    // Fetch prescriptions
    builder
      .addCase(fetchPrescriptions.fulfilled, (state, action) => {
        state.prescriptions = action.payload;
      });
  },
});

export const { clearError, setSelectedRecord, clearSelectedRecord } = healthSlice.actions;

export default healthSlice.reducer;

