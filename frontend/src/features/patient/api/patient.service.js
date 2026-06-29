/**
 * Patient Service
 * API calls for patient management and medical history
 */

import api from '@/services/apiClient';
import { logError, parseError } from '@/utils/errorHandler';
import { normalizeServiceResponse } from '@/services/responseNormalizer';

class PatientService {
    /**
     * Get all patients with optional search
     * @param {Object} params - Query parameters { search: string }
     * @returns {Promise<Array>} - List of all patients
     */
    async getAllPatients(params = {}, options = {}) {
        try {
            const queryParams = new URLSearchParams(params);
            const response = await api.get(`/patients/search?${queryParams.toString()}`, {
                useCache: options?.forceFresh !== true,
                skipCache: options?.forceFresh === true,
                cacheTTL: options?.cacheTTL ?? 20000,
            });
            return normalizeServiceResponse(response.data, { fallbackData: [] });
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
            return normalizeServiceResponse(response.data, { fallbackData: [] });
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
    async getPatientById(patientId, options = {}) {
        try {
            const response = await api.get(`/patients/${patientId}/profile`, {
                useCache: options?.useCache === true,
                skipCache: options?.forceFresh === true,
                cacheTTL: options?.cacheTTL ?? 30000,
            });
            return normalizeServiceResponse(response.data, { fallbackData: null });
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
            return normalizeServiceResponse(response.data, { fallbackData: null });
        } catch (error) {
            logError(error, { context: 'PatientService.getCompleteHistory', patientId });
            throw this.handleError(error);
        }
    }

    /**
     * Get patient profile (alias for getPatientById)
     * @param {String} patientId - Patient ID
     * @returns {Promise<Object>} - Patient profile
     */
    async getPatientProfile(patientId) {
        return this.getPatientById(patientId);
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
            return normalizeServiceResponse(response.data);
        } catch (error) {
            logError(error, { context: 'PatientService.updatePatientProfile', patientId });
            throw this.handleError(error);
        }
    }

    handleError(error) {
        return new Error(parseError(error));
    }
}

export default new PatientService();

