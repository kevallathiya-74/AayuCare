const Schedule = require("../models/Schedule");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

const DAY_ORDER = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
const sortByDayOfWeek = (arr) => arr.slice().sort((a, b) => (DAY_ORDER[a.dayOfWeek] ?? 7) - (DAY_ORDER[b.dayOfWeek] ?? 7));

/**
 * Schedule Repository - MongoDB data access layer
 * No business logic - pure database operations only
 */
class ScheduleRepository {
  /**
   * Create a new schedule
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} Created schedule
   */
  async create(scheduleData) {
    const schedule = new Schedule(scheduleData);
    return await schedule.save();
  }

  /**
   * Find schedule by ID
   * @param {string} id - Schedule ID
   * @returns {Promise<Object|null>} Schedule object or null
   */
  async findById(id) {
    return await Schedule.findById(id).lean();
  }

  /**
   * Find schedule by doctor and day
   * @param {string} doctorId - Doctor ID
   * @param {string} dayOfWeek - Day of week (lowercase)
   * @returns {Promise<Object|null>} Schedule object or null
   */
  async findByDoctorAndDay(doctorId, dayOfWeek) {
    return await Schedule.findOne({ doctorId, dayOfWeek }).lean();
  }

  /**
   * Find all schedules for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {string} [hospitalId] - Optional hospital scope
   * @returns {Promise<Array>} Array of schedules
   */
  async findByDoctor(doctorId, hospitalId = null) {
    const filter = { doctorId };
    if (hospitalId) filter.hospitalId = hospitalId;
    const results = await Schedule.find(filter).lean();
    return sortByDayOfWeek(results);
  }

  /**
   * Find available schedules for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {string} [hospitalId] - Optional hospital scope
   * @returns {Promise<Array>} Array of available schedules
   */
  async findAvailableByDoctor(doctorId, hospitalId = null) {
    const filter = { doctorId, isAvailable: true };
    if (hospitalId) filter.hospitalId = hospitalId;
    const results = await Schedule.find(filter).lean();
    return sortByDayOfWeek(results);
  }

  /**
   * Update schedule
   * @param {string} id - Schedule ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated schedule
   */
  async update(id, updates) {
    return await Schedule.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /**
   * Update schedule by doctor and day
   * @param {string} doctorId - Doctor ID
   * @param {string} dayOfWeek - Day of week
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated schedule
   */
  async updateByDoctorAndDay(doctorId, dayOfWeek, updates) {
    return await Schedule.findOneAndUpdate(
      { doctorId, dayOfWeek },
      updates,
      {
        new: true,
        runValidators: true,
        upsert: true,
      }
    ).lean();
  }

  /**
   * Add or update time slot
   * @param {string} doctorId - Doctor ID
   * @param {string} dayOfWeek - Day of week
   * @param {Object} timeSlot - Time slot data
   * @returns {Promise<Object>} Updated schedule
   */
  async addTimeSlot(doctorId, dayOfWeek, timeSlot) {
    return await Schedule.findOneAndUpdate(
      { doctorId, dayOfWeek },
      { $push: { timeSlots: timeSlot } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
  }

  /**
   * Remove time slot
   * @param {string} doctorId - Doctor ID
   * @param {string} dayOfWeek - Day of week
   * @param {string} timeSlotId - Time slot ID
   * @returns {Promise<Object>} Updated schedule
   */
  async removeTimeSlot(doctorId, dayOfWeek, timeSlotId) {
    return await Schedule.findOneAndUpdate(
      { doctorId, dayOfWeek },
      { $pull: { timeSlots: { _id: timeSlotId } } },
      { new: true }
    ).lean();
  }

  /**
   * Toggle schedule availability
   * @param {string} id - Schedule ID
   * @param {boolean} isAvailable - Availability status
   * @returns {Promise<Object>} Updated schedule
   */
  async toggleAvailability(id, isAvailable) {
    return await this.update(id, { isAvailable });
  }

  /**
   * Delete schedule
   * @param {string} id - Schedule ID
   * @returns {Promise<Object>} Deleted schedule
   */
  async delete(id) {
    return await Schedule.findByIdAndDelete(id);
  }

  /**
   * Delete all schedules for a doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteByDoctor(doctorId) {
    return await Schedule.deleteMany({ doctorId });
  }

  /**
   * Bulk create schedules for a doctor (weekly)
   * @param {string} doctorId - Doctor ID
   * @param {Array} schedules - Array of schedule data
   * @returns {Promise<Array>} Created schedules
   */
  async bulkCreate(doctorId, schedules) {
    const scheduleDocuments = schedules.map((schedule) => ({
      ...schedule,
      doctorId,
    }));

    return await Schedule.insertMany(scheduleDocuments, { ordered: false });
  }

  /**
   * Get available time slots for a specific day
   * @param {string} doctorId - Doctor ID
   * @param {string} dayOfWeek - Day of week
   * @returns {Promise<Array>} Array of available time slots
   */
  async getAvailableTimeSlots(doctorId, dayOfWeek, hospitalId = null) {
    const filter = { doctorId, dayOfWeek, isAvailable: true };
    if (hospitalId) filter.hospitalId = hospitalId;
    const schedule = await Schedule.findOne(filter).lean();

    if (!schedule) {
      return [];
    }

    return schedule.timeSlots.filter((slot) => slot.isAvailable);
  }

  /**
   * Check if doctor is available on a specific day
   * @param {string} doctorId - Doctor ID
   * @param {string} dayOfWeek - Day of week
   * @returns {Promise<boolean>} True if available
   */
  async isDoctorAvailable(doctorId, dayOfWeek) {
    const schedule = await Schedule.findOne({
      doctorId,
      dayOfWeek,
      isAvailable: true,
    });

    return !!schedule;
  }

  /**
   * Count schedules
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Count of schedules
   */
  async count(filters = {}) {
    return await Schedule.countDocuments(filters);
  }
}

module.exports = new ScheduleRepository();
