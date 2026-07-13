/**
 * AayuCare - Medical Records Service
 * Handles all medical records API calls
 */

import api from "./apiClient";
import { logError } from "../utils/errorHandler";
import {
  extractResponseData,
  normalizeServiceResponse,
} from "./responseNormalizer";

/**
 * Get patient medical records by patient ID
 */
export const getPatientMedicalRecords = async (patientId, filters = {}) => {
  try {
    const { recordType, startDate, endDate, page = 1, limit = 10 } = filters;

    const params = new URLSearchParams();
    if (recordType) params.append("recordType", recordType);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("page", page);
    params.append("limit", limit);

    const response = await api.get(
      `/medical-records/patient/${patientId}?${params}`
    );
    return extractResponseData(response.data, []);
  } catch (error) {
    logError(error, {
      context: "medicalRecordService.getPatientMedicalRecords",
      patientId,
    });
    throw error;
  }
};

/**
 * Get patient records (alias for compatibility)
 */
export const getPatientRecords = getPatientMedicalRecords;

/**
 * Get complete patient history including records, appointments, and prescriptions
 * (Doctor/Admin only)
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} - Full history with medical records, appointments, prescriptions
 */
export const getPatientHistory = async (patientId) => {
  try {
    const response = await api.get(`/medical-records/history/${patientId}`);
    return normalizeServiceResponse(response.data);
  } catch (error) {
    logError(error, {
      context: "medicalRecordService.getPatientHistory",
      patientId,
    });
    throw error;
  }
};

/**
 * Get all medical records
 */
export const getAllRecords = async (params = {}) => {
  try {
    const response = await api.get("/medical-records", { params });
    return normalizeServiceResponse(response.data);
  } catch (error) {
    logError(error, { context: "medicalRecordService.getAllRecords" });
    throw error;
  }
};

/**
 * Create new medical record
 */
export const createMedicalRecord = async (recordData) => {
  try {
    const response = await api.post("/medical-records", recordData);
    return normalizeServiceResponse(response.data);
  } catch (error) {
    logError(error, { context: "medicalRecordService.createMedicalRecord" });
    throw error;
  }
};

/**
 * Update an existing medical record
 */
export const updateMedicalRecord = async (recordId, updates) => {
  try {
    const response = await api.put(`/medical-records/${recordId}`, updates);
    return normalizeServiceResponse(response.data);
  } catch (error) {
    logError(error, {
      context: "medicalRecordService.updateMedicalRecord",
      recordId,
    });
    throw error;
  }
};

/**
 * Delete a medical record
 */
export const deleteMedicalRecord = async (recordId) => {
  try {
    const response = await api.delete(`/medical-records/${recordId}`);
    return normalizeServiceResponse(response.data);
  } catch (error) {
    logError(error, {
      context: "medicalRecordService.deleteMedicalRecord",
      recordId,
    });
    throw error;
  }
};

/**
 * Export all functions
 */
export default {
  getPatientMedicalRecords,
  getPatientRecords,
  getPatientHistory,
  getAllRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
};
