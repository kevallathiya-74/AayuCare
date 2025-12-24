/**
 * Event Service
 * Hospital events, camps, and health programs API calls
 */

import api from './api';
import { logError } from '../utils/errorHandler';

const eventService = {
    /**
     * Get all upcoming events
     * @param {object} filters - Optional filters (type, limit)
     * @returns {Promise} - Events list
     */
    async getUpcomingEvents(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await api.get(`/events${params ? `?${params}` : ''}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'eventService.getUpcomingEvents', filters });
            throw error;
        }
    },

    /**
     * Get event by ID
     * @param {string} eventId - Event ID
     * @returns {Promise} - Event details
     */
    async getEventById(eventId) {
        try {
            const response = await api.get(`/events/${eventId}`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'eventService.getEventById', eventId });
            throw error;
        }
    },

    /**
     * Register for an event
     * @param {string} eventId - Event ID
     * @returns {Promise} - Registration response
     */
    async registerForEvent(eventId) {
        try {
            const response = await api.post(`/events/${eventId}/register`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'eventService.registerForEvent', eventId });
            throw error;
        }
    },

    /**
     * Cancel event registration
     * @param {string} eventId - Event ID
     * @returns {Promise} - Cancellation response
     */
    async cancelRegistration(eventId) {
        try {
            const response = await api.delete(`/events/${eventId}/register`);
            return response.data;
        } catch (error) {
            logError(error, { context: 'eventService.cancelRegistration', eventId });
            throw error;
        }
    },
};

export default eventService;
