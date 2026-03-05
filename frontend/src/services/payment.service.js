/**
 * Payment Service
 * Handles pharmacy billing and payment API calls
 */

import api from "./apiClient";
import { logError } from "../utils/errorHandler";

class PaymentService {
  /**
   * Create a new payment (pharmacy billing)
   * @param {Object} paymentData
   * @param {number}  paymentData.amount       - Total amount in INR
   * @param {string}  paymentData.paymentMethod - card | upi | cash
   * @param {string}  [paymentData.prescriptionId] - Linked prescription ID
   * @param {string}  [paymentData.purchaseType]   - hospital | external
   * @param {Array}   [paymentData.medicines]       - Medicine list
   * @returns {Promise<Object>} Created payment record
   */
  async createPayment(paymentData) {
    try {
      const response = await api.post("/payments", paymentData);
      return response.data;
    } catch (error) {
      logError(error, { context: "PaymentService.createPayment" });
      throw this.handleError(error);
    }
  }

  /**
   * Get payment history for a patient
   * @param {string} patientId
   * @param {Object} [params] - Optional filters (status, startDate, endDate, page, limit)
   * @returns {Promise<Object>}
   */
  async getPatientPayments(patientId, params = {}) {
    try {
      const response = await api.get(`/payments/patient/${patientId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      logError(error, { context: "PaymentService.getPatientPayments" });
      throw this.handleError(error);
    }
  }

  /**
   * Get a single payment by ID
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async getPaymentById(paymentId) {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      logError(error, { context: "PaymentService.getPaymentById" });
      throw this.handleError(error);
    }
  }

  /**
   * Get payment stats (admin only)
   * @param {Object} [params]
   * @returns {Promise<Object>}
   */
  async getPaymentStats(params = {}) {
    try {
      const response = await api.get("/payments/stats", { params });
      return response.data;
    } catch (error) {
      logError(error, { context: "PaymentService.getPaymentStats" });
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      return new Error(data?.message || `Request failed with status ${status}`);
    }
    if (error.request) {
      return new Error("No response from server. Please check your connection.");
    }
    return error;
  }
}

export default new PaymentService();
