const Notification = require("../models/Notification");
const { AppError } = require("../middleware/errorHandler");  
const logger = require("../utils/logger");

/**
 * Notification Repository - MongoDB data access layer
 * No business logic - pure database operations only
 */
class NotificationRepository {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async create(notificationData) {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  /**
   * Create multiple notifications (bulk create)
   * @param {Array} notificationArray - Array of notification data
   * @returns {Promise<Array>} Array of created notifications
   */
  async createBulk(notificationArray) {
    return await Notification.insertMany(notificationArray);
  }

  /**
   * Find notification by ID
   * @param {string} id - Notification ID
   * @returns {Promise<Object|null>} Notification object or null
   */
  async findById(id) {
    return await Notification.findById(id).lean();
  }

  /**
   * Find notifications by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of notifications
   */
  async findByUserId(userId, options = {}) {
    const { limit = 50, offset = 0, sort = { createdAt: -1 }, unreadOnly = false } = options;
    
    let query = { userId };
    if (unreadOnly) {
      query.read = false;
    }
    
    return await Notification.find(query)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Find notifications with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of notifications
   */
  async findWithFilters(filters = {}, options = {}) {
    const { limit = 50, offset = 0, sort = { createdAt: -1 } } = options;
    
    return await Notification.find(filters)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Count notifications
   * @param {Object} filters - Count filters  
   * @returns {Promise<number>} Count of notifications
   */
  async count(filters = {}) {
    return await Notification.countDocuments(filters);
  }

  /**
   * Get unread count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of unread notifications
   */
  async getUnreadCount(userId) {
    return await Notification.countDocuments({ 
      userId, 
      read: false 
    });
  }

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   * @param {string} userId - User ID (for security)
   * @returns {Promise<Object|null>} Updated notification or null
   */
  async markAsRead(id, userId) {
    return await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    ).lean();
  }

  /**
   * Mark all notifications as read for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
  }

  /**
   * Delete notification by ID
   * @param {string} id - Notification ID  
   * @param {string} userId - User ID (for security)
   * @returns {Promise<Object|null>} Deleted notification or null
   */
  async delete(id, userId) {
    return await Notification.findOneAndDelete({ _id: id, userId });
  }

  /**
   * Delete all notifications for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteAllForUser(userId) {
    return await Notification.deleteMany({ userId });
  }

  /**
   * Delete notifications older than specified date
   * @param {Date} beforeDate - Delete notifications before this date
   * @returns {Promise<Object>} Delete result
   */
  async deleteOldNotifications(beforeDate) {
    return await Notification.deleteMany({
      createdAt: { $lt: beforeDate }
    });
  }

  /**
   * Update notification by ID
   * @param {string} id - Notification ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated notification or null
   */
  async update(id, updateData) {
    return await Notification.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /**
   * Run an aggregation pipeline on the Notification collection.
   * @param {Array} pipeline - MongoDB aggregation pipeline stages
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipeline) {
    return await Notification.aggregate(pipeline);
  }

  /**
   * Find one notification by filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Object|null>} Notification or null
   */
  async findOne(filters) {
    return await Notification.findOne(filters).lean();
  }

  /**
   * Update multiple notifications
   * @param {Object} filters - Query filters
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  async updateMany(filters, updateData) {
    return await Notification.updateMany(filters, updateData);
  }

  /**
   * Delete notification by ID and user ID
   * @param {string} id - Notification ID
   * @param {string} userId - User ID (for security)
   * @returns {Promise<Object|null>} Deleted notification or null
   */
  async deleteByIdAndUserId(id, userId) {
    return await Notification.findOneAndDelete({
      _id: id,
      userId: userId
    }).lean();
  }
}

module.exports = new NotificationRepository();