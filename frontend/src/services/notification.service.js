/**
 * Notification Service
 * Handles notification API calls and real-time updates
 */

import api from './api';
import { logError, showError } from '../utils/errorHandler';

class NotificationService {
    /**
     * Get user notifications
     */
    async getNotifications(page = 1, limit = 20, readFilter = null) {
        try {
            let url = `/notifications?page=${page}&limit=${limit}`;
            if (readFilter !== null) {
                url += `&read=${readFilter}`;
            }
            
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            logError(error, { context: 'NotificationService.getNotifications' });
            throw error;
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount() {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data;
        } catch (error) {
            logError(error, { context: 'NotificationService.getUnreadCount' });
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            const response = await api.put(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'NotificationService.markAsRead' });
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const response = await api.put('/notifications/mark-all-read');
            return response.data;
        } catch (error) {
            logError(error, { context: 'NotificationService.markAllAsRead' });
            throw error;
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'NotificationService.deleteNotification' });
            throw error;
        }
    }

    /**
     * Clear all notifications
     */
    async clearAllNotifications() {
        try {
            const response = await api.delete('/notifications/clear-all');
            return response.data;
        } catch (error) {
            logError(error, { context: 'NotificationService.clearAllNotifications' });
            throw error;
        }
    }
}

export default new NotificationService();

