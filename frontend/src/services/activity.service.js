/**
 * Activity Service
 * API calls for activity tracking (steps, sleep, water, stress)
 */

import api from './api';
import { logError } from '../utils/errorHandler';

const activityService = {
    /**
     * Get activity data for a patient
     * @param {string} patientId - Patient user ID
     * @returns {Promise} - Activity data
     */
    async getActivityData(patientId) {
        try {
            const response = await api.get(`/patients/${patientId}/activity`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'activityService.getActivityData', patientId });
            throw error;
        }
    },

    /**
     * Update activity data
     * @param {string} patientId - Patient user ID
     * @param {object} activityData - Activity data (type, value, notes)
     * @returns {Promise} - Updated activity
     */
    async updateActivity(patientId, activityData) {
        try {
            const response = await api.post(`/patients/${patientId}/activity`, activityData);
            return response.data;
        } catch (error) {
            logError(error, { context: 'activityService.updateActivity', patientId });
            throw error;
        }
    },

    /**
     * Add water intake
     * @param {string} patientId - Patient user ID
     * @param {number} glasses - Number of glasses
     * @returns {Promise} - Updated water data
     */
    async addWater(patientId, glasses) {
        try {
            const response = await api.post(`/patients/${patientId}/activity`, {
                type: 'water',
                value: glasses,
            });
            return response.data;
        } catch (error) {
            logError(error, { context: 'activityService.addWater', patientId });
            throw error;
        }
    },

    /**
     * Update steps count
     * @param {string} patientId - Patient user ID
     * @param {number} steps - Number of steps
     * @returns {Promise} - Updated steps data
     */
    async updateSteps(patientId, steps) {
        try {
            const response = await api.post(`/patients/${patientId}/activity`, {
                type: 'steps',
                value: steps,
            });
            return response.data;
        } catch (error) {
            logError(error, { context: 'activityService.updateSteps', patientId });
            throw error;
        }
    },

    /**
     * Log sleep data
     * @param {string} patientId - Patient user ID
     * @param {object} sleepData - Sleep data (duration, quality, bedtime, wakeTime)
     * @returns {Promise} - Logged sleep data
     */
    async logSleep(patientId, sleepData) {
        try {
            const response = await api.post(`/patients/${patientId}/activity`, {
                type: 'sleep',
                value: sleepData,
            });
            return response.data;
        } catch (error) {
            logError(error, { context: 'activityService.logSleep', patientId });
            throw error;
        }
    },
};

export default activityService;
