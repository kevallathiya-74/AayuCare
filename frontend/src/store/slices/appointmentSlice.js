/**
 * AayuCare - Appointment Redux Slice
 *
 * Manages appointment state.
 */

import { createSlice } from "@reduxjs/toolkit";

// Initial state
const initialState = {
  appointments: [],
  selectedAppointment: null,
  isLoading: false,
  error: null,
};

// Create the slice
const appointmentSlice = createSlice({
  name: "appointment",
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
});

export const { clearError, setSelectedAppointment, clearSelectedAppointment } =
  appointmentSlice.actions;

export default appointmentSlice.reducer;
