/**
 * AayuCare - Medical Records Service
 * Handles all medical records API calls
 */

import api from './apiClient';
import { logError } from '../utils/errorHandler';

/**
 * Get patient medical records by patient ID
 */
export const getPatientMedicalRecords = async (patientId, filters = {}) => {
    try {
        const { recordType, startDate, endDate, page = 1, limit = 10 } = filters;

        const params = new URLSearchParams();
        if (recordType) params.append('recordType', recordType);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('page', page);
        params.append('limit', limit);

        const response = await api.get(`/medical-records/patient/${patientId}?${params}`);
        return response.data.data;
    } catch (error) {
        logError(error, { context: 'medicalRecordService.getPatientMedicalRecords', patientId });
        throw error;
    }
};

/**
 * Get patient records (alias for compatibility)
 */
export const getPatientRecords = getPatientMedicalRecords;

/**
 * Get all medical records
 */
export const getAllRecords = async () => {
    try {
        const response = await api.get('/medical-records');
        return response.data;
    } catch (error) {
        logError(error, { context: 'medicalRecordService.getAllRecords' });
        throw error;
    }
};

/**
 * Create new medical record
 */
export const createMedicalRecord = async (recordData) => {
    try {
        const response = await api.post('/medical-records', recordData);
        return response.data;
    } catch (error) {
        logError(error, { context: 'medicalRecordService.createMedicalRecord' });
        throw error;
    }
};

/**
 * Update an existing medical record
 */
export const updateMedicalRecord = async (recordId, updates) => {
    try {
        const response = await api.put(`/medical-records/${recordId}`, updates);
        return response.data;
    } catch (error) {
        logError(error, { context: 'medicalRecordService.updateMedicalRecord', recordId });
        throw error;
    }
};

/**
 * Delete a medical record
 */
export const deleteMedicalRecord = async (recordId) => {
    try {
        const response = await api.delete(`/medical-records/${recordId}`);
        return response.data;
    } catch (error) {
        logError(error, { context: 'medicalRecordService.deleteMedicalRecord', recordId });
        throw error;
    }
};

/**
 * Export all functions
 */
export default {
    getPatientMedicalRecords,
    getPatientRecords,
    getAllRecords,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
};

