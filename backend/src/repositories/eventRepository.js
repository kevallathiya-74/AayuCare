const Event = require("../models/Event");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * Event Repository - MongoDB data access layer
 * No business logic - pure database operations only
 */
class EventRepository {
  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created event
   */
  async create(eventData) {
    const event = new Event(eventData);
    return await event.save();
  }

  /**
   * Find event by ID
   * @param {string} id - Event ID
   * @returns {Promise<Object|null>} Event object or null
   */
  async findById(id) {
    return await Event.findById(id).lean();
  }

  /**
   * Find upcoming events
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of upcoming events
   */
  async findUpcoming(options = {}) {
    const { limit = 20, offset = 0, hospitalId } = options;
    
    let query = {
      date: { $gte: new Date() },
      status: { $in: ['active', 'upcoming'] }
    };
    
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }
    
    return await Event.find(query)
      .sort({ date: 1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Find events by hospital ID
   * @param {string} hospitalId - Hospital ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of events
   */
  async findByHospitalId(hospitalId, options = {}) {
    const { limit = 20, offset = 0, sort = { date: -1 } } = options;
    
    return await Event.find({ hospitalId })
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Find events with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options  
   * @returns {Promise<Array>} Array of events
   */
  async findWithFilters(filters = {}, options = {}) {
    const { limit = 20, offset = 0, sort = { date: -1 } } = options;
    
    return await Event.find(filters)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Count events
   * @param {Object} filters - Count filters
   * @returns {Promise<number>} Count of events
   */
  async count(filters = {}) {
    return await Event.countDocuments(filters);
  }

  /**
   * Register user for event
   * @param {string} eventId - Event ID
   * @param {Object} registrationData - Registration data
   * @returns {Promise<Object|null>} Updated event or null
   */
  async registerUser(eventId, registrationData) {
    return await Event.findByIdAndUpdate(
      eventId,
      {
        $push: { registrations: registrationData },
        $inc: { registeredCount: 1 }
      },
      { new: true }
    ).lean();
  }

  /**
   * Unregister user from event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID to unregister
   * @returns {Promise<Object|null>} Updated event or null
   */
  async unregisterUser(eventId, userId) {
    return await Event.findByIdAndUpdate(
      eventId,
      {
        $pull: { registrations: { userId } },
        $inc: { registeredCount: -1 }
      },
      { new: true }
    ).lean();
  }

  /**
   * Check if user is registered for event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if user is registered
   */
  async isUserRegistered(eventId, userId) {
    const event = await Event.findById(eventId)
      .select('registrations')
      .lean();
    
    if (!event) return false;
    
    return event.registrations.some(reg => reg.userId === userId);
  }

  /**
   * Update event by ID
   * @param {string} id - Event ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated event or null
   */
  async update(id, updateData) {
    // Wrap in $set to prevent MongoDB operator injection from user-controlled updateData
    return await Event.findByIdAndUpdate(id, { $set: updateData }, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /**
   * Delete event by ID
   * @param {string} id - Event ID
   * @returns {Promise<Object|null>} Deleted event or null
   */
  async delete(id) {
    return await Event.findByIdAndDelete(id);
  }

  /**
   * Update event status
   * @param {string} id - Event ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>} Updated event or null
   */
  async updateStatus(id, status) {
    return await Event.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
  }

  /**
   * Get events by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of events
   */
  async findByDateRange(startDate, endDate, options = {}) {
    const { limit = 50, offset = 0, hospitalId } = options;
    
    let query = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }
    
    return await Event.find(query)
      .sort({ date: 1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }
}

module.exports = new EventRepository();