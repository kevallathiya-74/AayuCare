/**
 * Prescription Service
 * Handles prescription creation, retrieval, and patient notifications
 */

import api from './api';

class PrescriptionService {
    /**
     * Create a new prescription
     * @param {Object} prescriptionData - Prescription details
     * @returns {Promise<Object>} - Created prescription
     */
    async createPrescription(prescriptionData) {
        try {
            const response = await api.post('/prescriptions', prescriptionData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get prescriptions for a patient
     * @param {String} patientId - Patient ID
     * @returns {Promise<Array>} - List of prescriptions
     */
    async getPatientPrescriptions(patientId) {
        try {
            const response = await api.get(`/prescriptions/patient/${patientId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get prescription by ID
     * @param {String} prescriptionId - Prescription ID
     * @returns {Promise<Object>} - Prescription details
     */
    async getPrescriptionById(prescriptionId) {
        try {
            const response = await api.get(`/prescriptions/${prescriptionId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get prescriptions created by a doctor
     * @param {String} doctorId - Doctor ID
     * @returns {Promise<Array>} - List of prescriptions
     */
    async getDoctorPrescriptions(doctorId) {
        try {
            const response = await api.get(`/prescriptions/doctor/${doctorId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Update prescription status
     * @param {String} prescriptionId - Prescription ID
     * @param {String} status - New status
     * @returns {Promise<Object>} - Updated prescription
     */
    async updatePrescriptionStatus(prescriptionId, status) {
        try {
            const response = await api.patch(`/prescriptions/${prescriptionId}/status`, { status });
            return response.data;
        } catch (error) {
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

export default new PrescriptionService();
