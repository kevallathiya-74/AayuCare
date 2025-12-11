/**
 * AayuCare - Medical Records Service
 * Handles all medical records API calls
 */

import api from './api';

/**
 * Create new medical record
 */
export const createMedicalRecord = async (recordData) => {
    try {
        const response = await api.post('/medical-records', recordData);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get patient's medical records
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
        throw error;
    }
};

/**
 * Get single medical record
 */
export const getMedicalRecord = async (recordId) => {
    try {
        const response = await api.get(`/medical-records/${recordId}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Update medical record
 */
export const updateMedicalRecord = async (recordId, updateData) => {
    try {
        const response = await api.put(`/medical-records/${recordId}`, updateData);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete medical record
 */
export const deleteMedicalRecord = async (recordId) => {
    try {
        const response = await api.delete(`/medical-records/${recordId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get patient's complete medical history
 */
export const getPatientHistory = async (patientId) => {
    try {
        const response = await api.get(`/medical-records/history/${patientId}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all medical records (admin only)
 */
export const getAllRecords = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/medical-records?${params}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get patient records by patient ID
 */
export const getPatientRecords = async (patientId) => {
    try {
        const response = await api.get(`/medical-records/patient/${patientId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default {
    createMedicalRecord,
    getPatientMedicalRecords,
    getMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
    getPatientHistory,
    getAllRecords,
    getPatientRecords,
};
