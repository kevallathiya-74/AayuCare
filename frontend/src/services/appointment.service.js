/**
 * Appointment API Service
 * Handles all appointment-related API calls
 */

import api from './apiClient';
import { logError } from '../utils/errorHandler';

class AppointmentService {
    /**
     * Create new appointment
     */
    async createAppointment(appointmentData) {
        try {
            const response = await api.post('/appointments', appointmentData);
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.createAppointment' });
            throw error;
        }
    }

    /**
     * Get appointments with cursor-based pagination
     */
    async getAppointmentsCursor(filters = {}) {
        try {
            // Filter out null/undefined values to prevent "null" strings in query params
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v != null && v !== 'null' && v !== '')
            );
            const params = new URLSearchParams(cleanFilters).toString();
            const response = await api.get(`/appointments/cursor?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getAppointmentsCursor' });
            throw error;
        }
    }

    /**
     * Get patient appointments with cursor-based pagination
     * Routes to the single cursor endpoint; backend filters by role automatically.
     */
    async getPatientAppointmentsCursor(patientId, filters = {}) {
        try {
            const cleanFilters = Object.fromEntries(
                Object.entries({ ...filters, patientId }).filter(([_, v]) => v != null && v !== 'null' && v !== '')
            );
            const params = new URLSearchParams(cleanFilters).toString();
            const response = await api.get(`/appointments/cursor?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getPatientAppointmentsCursor', patientId });
            throw error;
        }
    }

    /**
     * Get doctor appointments with cursor-based pagination
     * Routes to the single cursor endpoint; backend filters by role automatically.
     */
    async getDoctorAppointmentsCursor(doctorId, filters = {}) {
        try {
            const cleanFilters = Object.fromEntries(
                Object.entries({ ...filters, doctorId }).filter(([_, v]) => v != null && v !== 'null' && v !== '')
            );
            const params = new URLSearchParams(cleanFilters).toString();
            const response = await api.get(`/appointments/cursor?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getDoctorAppointmentsCursor', doctorId });
            throw error;
        }
    }

    /**
     * Get all appointments (admin only)
     * Now uses the main /appointments endpoint with role-based filtering
     */
    async getAllAppointments(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            // Use main endpoint - backend handles admin access automatically
            const response = await api.get(`/appointments?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getAllAppointments' });
            throw error;
        }
    }

    /**
     * Get all appointments for current user
     */
    async getAppointments(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await api.get(`/appointments?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getAppointments' });
            throw error;
        }
    }

    /**
     * Get appointments for a specific patient
     */
    async getPatientAppointments(patientId) {
        try {
            const response = await api.get(`/appointments/patient/${patientId}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getPatientAppointments', patientId });
            throw error;
        }
    }

    /**
     * Get single appointment
     */
    async getAppointment(appointmentId) {
        try {
            const response = await api.get(`/appointments/${appointmentId}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getAppointment', appointmentId });
            throw error;
        }
    }

    /**
     * Update appointment
     */
    async updateAppointment(appointmentId, updateData) {
        try {
            const response = await api.put(`/appointments/${appointmentId}`, updateData);
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.updateAppointment', appointmentId });
            throw error;
        }
    }

    /**
     * Update appointment status
     */
    async updateAppointmentStatus(appointmentId, status) {
        try {
            const response = await api.patch(`/appointments/${appointmentId}/status`, { status });
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.updateAppointmentStatus', appointmentId });
            throw error;
        }
    }

    /**
     * Cancel appointment
     */
    async cancelAppointment(appointmentId, cancelReason) {
        try {
            const response = await api.post(`/appointments/${appointmentId}/cancel`, { cancelReason });
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.cancelAppointment', appointmentId });
            throw error;
        }
    }

    /**
     * Get available time slots for a doctor
     */
    async getAvailableSlots(doctorId, date) {
        try {
            const response = await api.get(`/appointments/slots/${doctorId}`, {
                params: { date }
            });
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getAvailableSlots', doctorId });
            throw error;
        }
    }

    /**
     * Get appointment statistics
     */
    async getAppointmentStats() {
        try {
            const response = await api.get('/appointments/stats');
            return response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getAppointmentStats' });
            throw error;
        }
    }
}

export default new AppointmentService();

