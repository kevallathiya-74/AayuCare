/**
 * Pharmacy Service
 * Handles API requests related to pharmacy operations like viewing prescriptions
 */

import api from './apiClient';
import { normalizeServiceResponse } from './responseNormalizer';

class PharmacyService {
  /**
   * Get all prescriptions with filters (for pharmacy staff)
   * @param {Object} params - { status: 'pending', page: 1, limit: 10 }
   * @returns {Promise<Object>}
   */
  async getPrescriptions(params = {}) {
    try {
      const normalizedParams = {
        ...params,
        pharmacyStatus: params.pharmacyStatus || params.status,
      };
      delete normalizedParams.status;

      const response = await api.get('/prescriptions', { params: normalizedParams });
      return normalizeServiceResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update prescription pharmacy status
   * @param {string} prescriptionId
   * @param {string} status - 'pending', 'preparing', 'ready', 'dispensed', 'cancelled'
   * @returns {Promise<Object>}
   */
  async updateStatus(prescriptionId, status) {
    try {
      const response = await api.patch(`/prescriptions/${prescriptionId}/pharmacy-status`, {
        pharmacyStatus: status,
      });
      return normalizeServiceResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pharmacy dashboard statistics
   * @returns {Promise<Object>}
   */
  async getDashboardStats() {
    try {
      const response = await api.get('/prescriptions/pharmacy/stats');
      return normalizeServiceResponse(response.data);
    } catch (error) {
      throw error;
    }
  }
}

export default new PharmacyService();
