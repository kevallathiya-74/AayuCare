/**
 * Prescription Service
 * Handles prescription creation, retrieval, and patient notifications
 */

import api from './apiClient';
import { logError } from '../utils/errorHandler';
import { normalizeServiceResponse } from './responseNormalizer';

class PrescriptionService {
    /**
     * Create a new prescription
     * @param {Object} prescriptionData - Prescription details
     * @returns {Promise<Object>} - Created prescription
     */
    async createPrescription(prescriptionData) {
        try {
            const response = await api.post('/prescriptions', prescriptionData);
            return normalizeServiceResponse(response.data);
        } catch (error) {
            logError(error, { context: 'PrescriptionService.createPrescription' });
            throw error;
        }
    }

    /**
     * Get prescriptions for a patient
     * @param {String} patientId - Patient ID
     * @returns {Promise<Array>} - List of prescriptions
     */
    async getPatientPrescriptions(patientId, params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            const response = await api.get(`/prescriptions/patient/${patientId}${query ? `?${query}` : ''}`);
            return normalizeServiceResponse(response.data);
        } catch (error) {
            logError(error, { context: 'PrescriptionService.getPatientPrescriptions' });
            throw error;
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
            return normalizeServiceResponse(response.data);
        } catch (error) {
            logError(error, { context: 'PrescriptionService.getPrescriptionById' });
            throw error;
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
            return normalizeServiceResponse(response.data);
        } catch (error) {
            logError(error, { context: 'PrescriptionService.getDoctorPrescriptions' });
            throw error;
        }
    }

    /**
     * Update prescription status (doctor/admin)
     * @param {String} prescriptionId - Prescription ID
     * @param {String} status - New status
     * @returns {Promise<Object>} - Updated prescription
     */
    async updatePrescriptionStatus(prescriptionId, status) {
        try {
            const response = await api.patch(`/prescriptions/${prescriptionId}/status`, { status });
            return normalizeServiceResponse(response.data);
        } catch (error) {
            logError(error, { context: 'PrescriptionService.updatePrescriptionStatus' });
            throw error;
        }
    }

    /**
     * Update pharmacy status for a prescription (admin only)
     * @param {String} prescriptionId - Prescription ID
     * @param {String} pharmacyStatus - New pharmacy status (pending|preparing|ready|dispensed|cancelled)
     * @param {Object} paymentData - Optional payment info
     * @returns {Promise<Object>} - Updated prescription
     */
    async updatePharmacyStatus(prescriptionId, pharmacyStatus, paymentData = {}) {
        try {
            const response = await api.patch(`/prescriptions/${prescriptionId}/pharmacy-status`, { pharmacyStatus, ...paymentData });
            return normalizeServiceResponse(response.data);
        } catch (error) {
            logError(error, { context: 'PrescriptionService.updatePharmacyStatus' });
            throw error;
        }
    }

    /**
     * Get all prescriptions (admin only)
     * @param {Object} params - Optional query params (page, limit)
     * @returns {Promise<Array>} - List of all prescriptions
     */
    async getAllPrescriptions(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await api.get(`/prescriptions${queryString ? `?${queryString}` : ''}`);
            return normalizeServiceResponse(response.data);
        } catch (error) {
            logError(error, { context: 'PrescriptionService.getAllPrescriptions' });
            throw error;
        }
    }

    /**
     * Delete a prescription (admin only)
     * @param {String} prescriptionId - Prescription ID
     * @returns {Promise<Object>} - Deletion confirmation
     */
    async deletePrescription(prescriptionId) {
        try {
            const response = await api.delete(`/prescriptions/${prescriptionId}`);
            return normalizeServiceResponse(response.data);
        } catch (error) {
            logError(error, { context: 'PrescriptionService.deletePrescription' });
            throw error;
        }
    }
}

export default new PrescriptionService();
