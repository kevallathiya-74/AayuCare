/**
 * Notification Controller
 * Handles notification CRUD operations and user notifications
 */

const Notification = require("../models/Notification");
const logger = require("../utils/logger");

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, read } = req.query;
    const userId = req.user.userId;

    const query = { userId: req.user._id };
    if (read !== undefined) {
      query.read = read === "true";
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      unreadCount,
    });
  } catch (error) {
    logger.error("Get notifications error:", {
      error: error.message,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    logger.error("Get unread count error:", {
      error: error.message,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    logger.error("Mark as read error:", {
      error: error.message,
      notificationId: req.params.id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: "All notifications marked as read",
      updated: result.modifiedCount,
    });
  } catch (error) {
    logger.error("Mark all as read error:", {
      error: error.message,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    logger.error("Delete notification error:", {
      error: error.message,
      notificationId: req.params.id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete all notifications for user
 * @route   DELETE /api/notifications/clear-all
 * @access  Private
 */
exports.clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user._id });

    res.json({
      success: true,
      message: "All notifications cleared",
      deleted: result.deletedCount,
    });
  } catch (error) {
    logger.error("Clear all notifications error:", {
      error: error.message,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
      error: error.message,
    });
  }
};

/**
 * @desc    Create notification (System/Admin use)
 * @route   POST /api/notifications
 * @access  Private (Admin/System)
 */
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, priority, data, actionUrl, icon } =
      req.body;

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || "system",
      priority: priority || "medium",
      data,
      actionUrl,
      icon,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    logger.error("Create notification error:", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

/**
 * @desc    Send notification to multiple users
 * @route   POST /api/notifications/broadcast
 * @access  Private (Admin only)
 */
exports.broadcastNotification = async (req, res) => {
  try {
    const { userIds, title, message, type, priority, data, actionUrl, icon } =
      req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of user IDs",
      });
    }

    const notifications = userIds.map((userId) => ({
      userId,
      title,
      message,
      type: type || "system",
      priority: priority || "medium",
      data,
      actionUrl,
      icon: icon || "notifications",
    }));

    const result = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Notification sent to ${result.length} users`,
      count: result.length,
    });
  } catch (error) {
    logger.error("Broadcast notification error:", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Failed to broadcast notification",
      error: error.message,
    });
  }
};
