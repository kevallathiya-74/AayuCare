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
        const response = await api.post('/appointments', appointmentData);
        return response.data?.data || response.data;
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
            return response.data?.data || response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getAppointmentsCursor' });
            throw error;
        }
    }

    /**
     * Get patient appointments with cursor-based pagination
     */
    async getPatientAppointmentsCursor(patientId, filters = {}) {
        try {
            // Filter out null/undefined values to prevent "null" strings in query params
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v != null && v !== 'null' && v !== '')
            );
            const params = new URLSearchParams(cleanFilters).toString();
            const response = await api.get(`/appointments/patient/${patientId}/cursor?${params}`);
            return response.data?.data || response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getPatientAppointmentsCursor', patientId });
            throw error;
        }
    }

    /**
     * Get doctor appointments with cursor-based pagination
     */
    async getDoctorAppointmentsCursor(doctorId, filters = {}) {
        try {
            // Filter out null/undefined values to prevent "null" strings in query params
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v != null && v !== 'null' && v !== '')
            );
            const params = new URLSearchParams(cleanFilters).toString();
            const response = await api.get(`/appointments/doctor/${doctorId}/cursor?${params}`);
            return response.data?.data || response.data;
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
            return response.data?.data || response.data;
        } catch (error) {
            logError(error, { context: 'AppointmentService.getAllAppointments' });
            throw error;
        }
    }

    /**
     * Get all appointments for current user
     */
    async getAppointments(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/appointments?${params}`);
        return response.data?.data || response.data;
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
        const response = await api.get(`/appointments/${appointmentId}`);
        return response.data;
    }

    /**
     * Update appointment
     */
    async updateAppointment(appointmentId, updateData) {
        const response = await api.put(`/appointments/${appointmentId}`, updateData);
        return response.data;
    }

    /**
     * Update appointment status
     */
    async updateAppointmentStatus(appointmentId, status) {
        const response = await api.patch(`/appointments/${appointmentId}/status`, { status });
        return response.data;
    }

    /**
     * Cancel appointment
     */
    async cancelAppointment(appointmentId, cancelReason) {
        const response = await api.post(`/appointments/${appointmentId}/cancel`, { cancelReason });
        return response.data;
    }

    /**
     * Get available time slots for a doctor
     */
    async getAvailableSlots(doctorId, date) {
        const response = await api.get(`/appointments/slots/${doctorId}`, {
            params: { date }
        });
        return response.data;
    }

    /**
     * Get appointment statistics
     */
    async getAppointmentStats() {
        const response = await api.get('/appointments/stats');
        return response.data;
    }
}

export default new AppointmentService();

