/**
 * Doctor API Service
 * Handles all doctor-related API calls
 */

import api from './api';
import { logError } from '../utils/errorHandler';

class DoctorService {
    /**
     * Get all doctors with filters
     */
    async getDoctors(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await api.get(`/doctors?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.getDoctors' });
            throw error;
        }
    }

    /**
     * Get all doctors (alias for admin screens)
     */
    async getAllDoctors() {
        return this.getDoctors({ limit: 100 });
    }

    /**
     * Get single doctor
     */
    async getDoctor(doctorId) {
        try {
            const response = await api.get(`/doctors/${doctorId}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.getDoctor', doctorId });
            throw error;
        }
    }

    /**
     * Get doctor statistics
     */
    async getDoctorStats(doctorId) {
        try {
            const response = await api.get(`/doctors/${doctorId}/stats`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.getDoctorStats', doctorId });
            throw error;
        }
    }

    /**
     * Get doctor dashboard data (for logged-in doctor)
     */
    async getDashboard() {
        try {
            const response = await api.get('/doctors/me/dashboard');
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.getDashboard' });
            throw error;
        }
    }

    /**
     * Get today's appointments for logged-in doctor
     * @param {string} filter - 'all', 'completed', 'pending'
     */
    async getTodaysAppointments(filter = 'all') {
        try {
            const response = await api.get(`/doctors/me/appointments/today?filter=${filter}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.getTodaysAppointments', filter });
            throw error;
        }
    }

    /**
     * Get upcoming appointments for logged-in doctor
     */
    async getUpcomingAppointments(page = 1, limit = 10) {
        try {
            const response = await api.get(`/doctors/me/appointments/upcoming?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.getUpcomingAppointments' });
            throw error;
        }
    }

    /**
     * Search patients who have visited this doctor
     */
    async searchMyPatients(query) {
        try {
            const response = await api.get(`/doctors/me/patients/search?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.searchMyPatients', query });
            throw error;
        }
    }

    /**
     * Update appointment status
     */
    async updateAppointmentStatus(appointmentId, status, notes = '') {
        try {
            const response = await api.patch(`/doctors/me/appointments/${appointmentId}/status`, { status, notes });
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.updateAppointmentStatus', appointmentId, status });
            throw error;
        }
    }

    /**
     * Get profile statistics for logged-in doctor
     */
    async getProfileStats() {
        try {
            const response = await api.get('/doctors/me/profile/stats');
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.getProfileStats' });
            throw error;
        }
    }

    /**
     * Search doctors
     */
    async searchDoctors(searchQuery) {
        try {
            const response = await api.get('/doctors', {
                params: { search: searchQuery }
            });
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.searchDoctors', searchQuery });
            throw error;
        }
    }

    /**
     * Get doctors by specialization
     */
    async getDoctorsBySpecialization(specialization) {
        try {
            const response = await api.get('/doctors', {
                params: { specialization }
            });
            return response.data;
        } catch (error) {
            logError(error, { context: 'DoctorService.getDoctorsBySpecialization', specialization });
            throw error;
        }
    }
}

export default new DoctorService();
