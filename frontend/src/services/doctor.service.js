/**
 * Doctor API Service
 * Handles all doctor-related API calls
 */

import api from './api';

class DoctorService {
    /**
     * Get all doctors with filters
     */
    async getDoctors(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/doctors?${params}`);
        return response.data;
    }

    /**
     * Get single doctor
     */
    async getDoctor(doctorId) {
        const response = await api.get(`/doctors/${doctorId}`);
        return response.data;
    }

    /**
     * Get doctor statistics
     */
    async getDoctorStats(doctorId) {
        const response = await api.get(`/doctors/${doctorId}/stats`);
        return response.data;
    }

    /**
     * Search doctors
     */
    async searchDoctors(searchQuery) {
        const response = await api.get('/doctors', {
            params: { search: searchQuery }
        });
        return response.data;
    }

    /**
     * Get doctors by specialization
     */
    async getDoctorsBySpecialization(specialization) {
        const response = await api.get('/doctors', {
            params: { specialization }
        });
        return response.data;
    }
}

export default new DoctorService();
