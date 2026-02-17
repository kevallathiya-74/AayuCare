/**
 * Admin Service
 * API calls for admin dashboard functionality
 */

import api from './apiClient';
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

    /**
     * Get security settings and statistics
     * @returns {Promise} - Security settings data
     */
    async getSecuritySettings() {
        try {
            const response = await api.get('/admin/security');
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.getSecuritySettings' });
            throw error;
        }
    },

    /**
     * Change password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} - Success message
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await api.post('/admin/security/change-password', {
                currentPassword,
                newPassword,
            });
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.changePassword' });
            throw error;
        }
    },

    /**
     * Logout from all devices
     * @returns {Promise} - Success message
     */
    async logoutAllDevices() {
        try {
            const response = await api.post('/admin/security/logout-all');
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.logoutAllDevices' });
            throw error;
        }
    },

    /**
     * Get medical records overview (metadata only)
     * @param {object} options - Query options (page, limit, patientId)
     * @returns {Promise} - Medical records metadata
     */
    async getMedicalRecordsOverview(options = {}) {
        try {
            const { page = 1, limit = 20, patientId } = options;
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(patientId && { patientId }),
            });
            const response = await api.get(`/admin/medical-records?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.getMedicalRecordsOverview', options });
            throw error;
        }
    },

    /**
     * Get system metrics and aggregations
     * @returns {Promise} - System metrics data
     */
    async getSystemMetrics() {
        try {
            const response = await api.get('/admin/system/metrics');
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.getSystemMetrics' });
            throw error;
        }
    },

    /**
     * Get notifications for management
     * @param {object} options - Query options (page, limit, type, status)
     * @returns {Promise} - Notifications data
     */
    async getNotificationsManagement(options = {}) {
        try {
            const { page = 1, limit = 20, type, status } = options;
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(type && { type }),
                ...(status && { status }),
            });
            const response = await api.get(`/admin/notifications/manage?${params}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.getNotificationsManagement', options });
            throw error;
        }
    },

    /**
     * Create new user (doctor or patient)
     * @param {object} userData - User data (name, email, phone, password, role, etc.)
     * @returns {Promise} - Created user data
     */
    async createUser(userData) {
        try {
            const response = await api.post('/admin/users', userData);
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.createUser', role: userData.role });
            throw error;
        }
    },

    /**
     * Update user profile (full profile update)
     * @param {string} userId - User ID
     * @param {object} profileData - Profile data to update
     * @returns {Promise} - Updated user data
     */
    async updateUserProfile(userId, profileData) {
        try {
            const response = await api.put(`/admin/users/${userId}`, profileData);
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.updateUserProfile', userId });
            throw error;
        }
    },

    /**
     * Delete user (soft delete - sets isActive to false)
     * @param {string} userId - User ID
     * @returns {Promise} - Deletion confirmation
     */
    async deleteUser(userId) {
        try {
            const response = await api.delete(`/admin/users/${userId}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.deleteUser', userId });
            throw error;
        }
    },

    /**
     * PERMANENT delete user (hard delete - removes all data permanently)
     * @param {string} userId - User ID
     * @returns {Promise} - Deletion confirmation
     * @warning This violates healthcare compliance - use with extreme caution
     */
    async permanentDeleteUser(userId) {
        try {
            const response = await api.delete(`/admin/users/${userId}/permanent`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'adminService.permanentDeleteUser', userId });
            throw error;
        }
    },
};

export default adminService;

