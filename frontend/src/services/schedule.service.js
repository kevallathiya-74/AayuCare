/**
 * Schedule Service
 * Handles API requests related to doctor schedules and availability
 */

import api from './apiClient';
import { normalizeServiceResponse } from './responseNormalizer';

class ScheduleService {
  /**
   * Get full weekly schedule for a doctor
   * @param {string} doctorId - Doctor UUID
   * @returns {Promise<Object>} - Contains full week schedule data
   */
  async getDoctorSchedule(doctorId) {
    try {
      const response = await api.get(`/schedules/${doctorId}`);
      return normalizeServiceResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available slots for booking on a specific date
   * @param {string} doctorId - Doctor UUID
   * @param {string} date - ISO Date string OR day name ('monday')
   * @returns {Promise<Object>} - Available slots array
   */
  async getAvailableSlots(doctorId, date) {
    try {
      const dateObj = new Date(date);
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = !isNaN(dateObj) ? days[dateObj.getDay()] : date.toLowerCase();
      
      const response = await api.get(`/schedules/${doctorId}/slots`, {
        params: { day: dayName, date: !isNaN(dateObj) ? dateObj.toISOString() : undefined }
      });
      return normalizeServiceResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update or create a full weekly schedule (Admin/Doctor)
   * @param {string} doctorId - Doctor UUID
   * @param {Array} schedules - Array of day schedules
   * @returns {Promise<Object>}
   */
  async setWeeklySchedule(doctorId, schedules) {
    try {
      const response = await api.put(`/schedules/${doctorId}/weekly`, { schedules });
      return normalizeServiceResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a specific day's schedule
   * @param {string} doctorId - Doctor UUID
   * @param {string} dayOfWeek - e.g., 'monday'
   * @param {Object} updates - Schedule updates
   * @returns {Promise<Object>}
   */
  async updateDaySchedule(doctorId, dayOfWeek, updates) {
    try {
      const response = await api.patch(`/schedules/${doctorId}/day/${dayOfWeek}`, updates);
      return normalizeServiceResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle availability for a schedule entry
   * @param {string} scheduleId - MongoDB Schedule _id
   * @param {boolean} isAvailable
   * @param {string} doctorId - Doctor UUID (optional but recommended for cache clearing)
   * @returns {Promise<Object>}
   */
  async toggleAvailability(scheduleId, isAvailable, doctorId) {
    try {
      const response = await api.patch(`/schedules/entries/${scheduleId}/availability`, 
        { isAvailable },
        { params: { doctorId } }
      );
      return normalizeServiceResponse(response.data);
    } catch (error) {
      throw error;
    }
  }
}

export default new ScheduleService();
