/**
 * AayuCare - Appointment Redux Slice
 * 
 * Manages appointment state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
  appointments: [],
  selectedAppointment: null,
  isLoading: false,
  error: null,
};

// Async thunks

export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/appointments', { params: filters });
      return response.data.appointments;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

export const fetchAppointmentById = createAsyncThunk(
  'appointments/fetchAppointmentById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/appointments/${id}`);
      return response.data.appointment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointment');
    }
  }
);

export const bookAppointment = createAsyncThunk(
  'appointments/bookAppointment',
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      return response.data.appointment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to book appointment');
    }
  }
);

export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/appointments/${id}`, data);
      return response.data.appointment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update appointment');
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/appointments/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel appointment');
    }
  }
);

// Slice
const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedAppointment: (state, action) => {
      state.selectedAppointment = action.payload;
    },
    clearSelectedAppointment: (state) => {
      state.selectedAppointment = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch appointments
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload;
        state.error = null;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Fetch appointment by ID
    builder
      .addCase(fetchAppointmentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedAppointment = action.payload;
        state.error = null;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Book appointment
    builder
      .addCase(bookAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments.unshift(action.payload);
        state.error = null;
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Update appointment
    builder
      .addCase(updateAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        state.selectedAppointment = action.payload;
      });
    
    // Cancel appointment
    builder
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.appointments = state.appointments.filter(a => a.id !== action.payload);
        if (state.selectedAppointment?.id === action.payload) {
          state.selectedAppointment = null;
        }
      });
  },
});

export const { clearError, setSelectedAppointment, clearSelectedAppointment } = appointmentSlice.actions;

export default appointmentSlice.reducer;

