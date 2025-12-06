/**
 * Appointment API Service
 * Handles all appointment-related API calls
 */

import api from './api';

class AppointmentService {
    /**
     * Create new appointment
     */
    async createAppointment(appointmentData) {
        const response = await api.post('/appointments', appointmentData);
        return response.data;
    }

    /**
     * Get all appointments for current user
     */
    async getAppointments(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/appointments?${params}`);
        return response.data;
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
