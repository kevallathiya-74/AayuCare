/**
 * Patient Service
 * API calls for patient management and medical history
 */

import api from './api';
import { logError } from '../utils/errorHandler';

class PatientService {
    /**
     * Get all patients
     * @returns {Promise<Array>} - List of all patients
     */
    async getAllPatients() {
        try {
            const response = await api.get('/patients/search');
            return response.data;
        } catch (error) {
            logError(error, { context: 'PatientService.getAllPatients' });
            throw this.handleError(error);
        }
    }

    /**
     * Search patients by name, ID, phone, or email
     * @param {String} query - Search query
     * @returns {Promise<Array>} - List of matching patients
     */
    async searchPatients(query) {
        try {
            const response = await api.get(`/patients/search?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'PatientService.searchPatients', query });
            throw this.handleError(error);
        }
    }

    /**
     * Get patient by ID
     * @param {String} patientId - Patient ID
     * @returns {Promise<Object>} - Patient data
     */
    async getPatientById(patientId) {
        try {
            const response = await api.get(`/patients/${patientId}/profile`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'PatientService.getPatientById', patientId });
            throw this.handleError(error);
        }
    }

    /**
     * Get complete medical history of a patient
     * @param {String} patientId - Patient ID
     * @returns {Promise<Object>} - Complete patient history
     */
    async getCompleteHistory(patientId) {
        try {
            const response = await api.get(`/patients/${patientId}/complete-history`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'PatientService.getCompleteHistory', patientId });
            throw this.handleError(error);
        }
    }

    /**
     * Get patient profile
     * @param {String} patientId - Patient ID
     * @returns {Promise<Object>} - Patient profile
     */
    async getPatientProfile(patientId) {
        try {
            const response = await api.get(`/patients/${patientId}/profile`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'PatientService.getPatientProfile', patientId });
            throw this.handleError(error);
        }
    }

    /**
     * Update patient profile
     * @param {String} patientId - Patient ID
     * @param {Object} updates - Profile updates
     * @returns {Promise<Object>} - Updated patient profile
     */
    async updatePatientProfile(patientId, updates) {
        try {
            const response = await api.patch(`/patients/${patientId}/profile`, updates);
            return response.data;
        } catch (error) {
            logError(error, { context: 'PatientService.updatePatientProfile', patientId });
            throw this.handleError(error);
        }
    }

    handleError(error) {
        if (error.response) {
            return error.response.data.message || 'An error occurred';
        } else if (error.request) {
            return 'Network error. Please check your connection.';
        } else {
            return error.message || 'An unexpected error occurred';
        }
    }
}

export default new PatientService();
