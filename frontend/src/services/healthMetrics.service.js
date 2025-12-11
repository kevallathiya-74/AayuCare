/**
 * Health Metrics Service
 * API calls for patient health metrics (BP, sugar, weight, BMI)
 */

import api from './api';
import { logError } from '../utils/errorHandler';

const healthMetricsService = {
    /**
     * Get all health metrics for a patient
     * @param {string} patientId - Patient user ID
     * @returns {Promise} - Health metrics data
     */
    async getMetrics(patientId) {
        try {
            const response = await api.get(`/patients/${patientId}/health-metrics`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'healthMetricsService.getMetrics', patientId });
            throw error;
        }
    },

    /**
     * Add a new health metric entry
     * @param {string} patientId - Patient user ID
     * @param {object} metricData - Metric data (type, value, timestamp)
     * @returns {Promise} - Created metric
     */
    async addMetric(patientId, metricData) {
        try {
            const response = await api.post(`/patients/${patientId}/health-metrics`, metricData);
            return response.data;
        } catch (error) {
            logError(error, { context: 'healthMetricsService.addMetric', patientId });
            throw error;
        }
    },

    /**
     * Get metrics by type (bp, sugar, weight, bmi)
     * @param {string} patientId - Patient user ID
     * @param {string} type - Metric type (bp, sugar, weight, bmi)
     * @param {object} options - Query options (startDate, endDate, limit)
     * @returns {Promise} - Filtered metrics
     */
    async getMetricsByType(patientId, type, options = {}) {
        try {
            const { startDate, endDate, limit = 30 } = options;
            const params = new URLSearchParams({
                type,
                limit: limit.toString(),
                ...(startDate && { startDate: startDate.toISOString() }),
                ...(endDate && { endDate: endDate.toISOString() }),
            });

            const response = await api.get(`/patients/${patientId}/health-metrics?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'healthMetricsService.getMetricsByType', patientId, type });
            throw error;
        }
    },

    /**
     * Get latest metric value
     * @param {string} patientId - Patient user ID
     * @param {string} type - Metric type
     * @returns {Promise} - Latest metric
     */
    async getLatestMetric(patientId, type) {
        try {
            const response = await api.get(`/patients/${patientId}/health-metrics/latest/${type}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'healthMetricsService.getLatestMetric', patientId, type });
            throw error;
        }
    },

    /**
     * Delete a metric entry
     * @param {string} metricId - Metric ID
     * @returns {Promise}
     */
    async deleteMetric(metricId) {
        try {
            const response = await api.delete(`/health-metrics/${metricId}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'healthMetricsService.deleteMetric', metricId });
            throw error;
        }
    },
};

export default healthMetricsService;
