/**
 * Admin Service
 * API calls for admin dashboard functionality
 */

import api from './api';
import { logError } from '../utils/errorHandler';

const adminService = {
    /**
     * Get dashboard statistics
     * @returns {Promise} - Dashboard stats (appointments, doctors, patients, prescriptions)
     */
    async getDashboardStats() {
        try {
            const response = await api.get('/admin/dashboard/stats');
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.getDashboardStats' });
            throw error;
        }
    },

    /**
     * Get recent activities for admin dashboard
     * @param {number} limit - Number of activities to fetch
     * @returns {Promise} - Recent activities array
     */
    async getRecentActivities(limit = 10) {
        try {
            const response = await api.get(`/admin/activities?limit=${limit}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.getRecentActivities' });
            throw error;
        }
    },

    /**
     * Get all users with pagination
     * @param {object} options - Query options (page, limit, role, search)
     * @returns {Promise} - Paginated users
     */
    async getUsers(options = {}) {
        try {
            const { page = 1, limit = 20, role, search } = options;
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(role && { role }),
                ...(search && { search }),
            });
            const response = await api.get(`/admin/users?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.getUsers', options });
            throw error;
        }
    },

    /**
     * Update user status (activate/deactivate)
     * @param {string} userId - User ID
     * @param {boolean} isActive - Active status
     * @returns {Promise}
     */
    async updateUserStatus(userId, isActive) {
        try {
            const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.updateUserStatus', userId, isActive });
            throw error;
        }
    },

    /**
     * Update user role (with optimistic locking)
     * @param {string} userId - User ID
     * @param {string} role - New role
     * @param {number} version - Document version for optimistic locking
     * @returns {Promise}
     */
    async updateUserRole(userId, role, version) {
        try {
            const response = await api.patch(`/admin/users/${userId}/role`, { role, version });
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.updateUserRole', userId, role });
            throw error;
        }
    },

    /**
     * Bulk update users (with transactional safety)
     * @param {Array} operations - Array of {userId, action, data}
     * @returns {Promise}
     */
    async bulkUpdateUsers(operations) {
        try {
            const response = await api.post('/admin/users/bulk', { operations });
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.bulkUpdateUsers', operationsCount: operations.length });
            throw error;
        }
    },

    /**
     * Get system health/status
     * @returns {Promise}
     */
    async getSystemHealth() {
        try {
            const response = await api.get('/admin/system/health');
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.getSystemHealth' });
            throw error;
        }
    },

    /**
     * Get audit logs
     * @param {object} options - Query options (startDate, endDate, action, userId)
     * @returns {Promise}
     */
    async getAuditLogs(options = {}) {
        try {
            const { startDate, endDate, action, userId, page = 1, limit = 50 } = options;
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(startDate && { startDate: startDate.toISOString() }),
                ...(endDate && { endDate: endDate.toISOString() }),
                ...(action && { action }),
                ...(userId && { userId }),
            });
            const response = await api.get(`/admin/audit-logs?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.getAuditLogs', options });
            throw error;
        }
    },
};

export default adminService;
