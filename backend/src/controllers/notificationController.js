/**
 * Notification Controller
 * Handles notification CRUD operations and user notifications
 */

const notificationRepository = require("../repositories/notificationRepository");
const logger = require("../utils/logger");
const { deleteCacheByPattern } = require("../config/redis");

// Resolve user's UUID string id from the authenticated request
const resolveUserId = (req) =>
  req.user?.id || req.user?.userId || req.user?._id?.toString();

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getUserNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, read } = req.query;
    const userId = resolveUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to fetch notifications",
      });
    }

    const query = { userId };
    if (read !== undefined) {
      query.read = read === "true";
    }

    const notifications = await notificationRepository.findWithFilters(
      query,
      {
        sort: { createdAt: -1 },
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
      }
    );

    const total = await notificationRepository.count(query);
    const unreadCount = await notificationRepository.getUnreadCount(userId);

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
      userId: resolveUserId(req),
    });
    next(error);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const count = userId ? await notificationRepository.getUnreadCount(userId) : 0;

    res.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    logger.error("Get unread count error:", {
      error: error.message,
      userId: resolveUserId(req),
    });
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = resolveUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user context for notifications",
      });
    }

    const notification = await notificationRepository.findById(id);

    if (!notification || notification.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notificationRepository.markAsRead(id, userId);

    // Refetch to return the updated document
    const updatedNotification = await notificationRepository.findById(id);

    // Invalidate relevant caches after notification update
    try {
      await deleteCacheByPattern("v1:cache:notification:*");
      await deleteCacheByPattern("cache:notification:*");
      logger.debug("Cache invalidated after notification marked as read");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: updatedNotification,
    });
  } catch (error) {
    logger.error("Mark as read error:", {
      error: error.message,
      notificationId: req.params.id,
    });
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user context for notifications",
      });
    }

    const result = await notificationRepository.markAllAsRead(userId);

    // Invalidate relevant caches after marking all as read
    try {
      await deleteCacheByPattern("v1:cache:notification:*");
      await deleteCacheByPattern("cache:notification:*");
      logger.debug("Cache invalidated after marking all notifications as read");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: "All notifications marked as read",
      updated: result.modifiedCount,
    });
  } catch (error) {
    logger.error("Mark all as read error:", {
      error: error.message,
      userId: resolveUserId(req),
    });
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = resolveUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user context for notifications",
      });
    }

    const result = await notificationRepository.delete(id, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Invalidate relevant caches after notification deletion
    try {
      await deleteCacheByPattern("v1:cache:notification:*");
      await deleteCacheByPattern("cache:notification:*");
      logger.debug("Cache invalidated after notification deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
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
    next(error);
  }
};

/**
 * @desc    Delete all notifications for user
 * @route   DELETE /api/notifications/clear-all
 * @access  Private
 */
exports.clearAllNotifications = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user context for notifications",
      });
    }

    const result = await notificationRepository.deleteAllForUser(userId);

    // Invalidate relevant caches after clearing all notifications
    try {
      await deleteCacheByPattern("v1:cache:notification:*");
      await deleteCacheByPattern("cache:notification:*");
      logger.debug("Cache invalidated after clearing all notifications");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: "All notifications cleared",
      deleted: result.deletedCount,
    });
  } catch (error) {
    logger.error("Clear all notifications error:", {
      error: error.message,
      userId: resolveUserId(req),
    });
    next(error);
  }
};

/**
 * @desc    Create notification (System/Admin use)
 * @route   POST /api/notifications
 * @access  Private (Admin/System)
 */
exports.createNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, priority, data, actionUrl, icon } =
      req.body;

    // Validate required fields
    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "title is required" });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const notification = await notificationRepository.create({
      userId,
      title,
      message,
      type: type || "system",
      priority: priority || "medium",
      data,
      actionUrl,
      icon,
      hospitalId: req.hospitalId || req.user?.hospitalId,
    });

    // Invalidate relevant caches after notification creation
    try {
      await deleteCacheByPattern("v1:cache:notification:*");
      await deleteCacheByPattern("cache:notification:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after notification creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    logger.error("Create notification error:", { error: error.message });
    next(error);
  }
};

/**
 * @desc    Send notification to multiple users
 * @route   POST /api/notifications/broadcast
 * @access  Private (Admin only)
 */
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { userIds, title, message, type, priority, data, actionUrl, icon } =
      req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of user IDs",
      });
    }

    if (userIds.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Cannot broadcast to more than 1000 recipients per request",
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "title and message are required",
      });
    }

    const hospitalId = req.hospitalId || req.user?.hospitalId;
    const notifications = userIds.map((userId) => ({
      userId,
      title,
      message,
      type: type || "system",
      priority: priority || "medium",
      data,
      actionUrl,
      icon: icon || "notifications",
      hospitalId,
    }));

    const result = await notificationRepository.createBulk(notifications);

    // Invalidate relevant caches after broadcast notification
    try {
      await deleteCacheByPattern("v1:cache:notification:*");
      await deleteCacheByPattern("cache:notification:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after broadcast notification");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(201).json({
      success: true,
      message: `Notification sent to ${result.length} users`,
      count: result.length,
    });
  } catch (error) {
    logger.error("Broadcast notification error:", { error: error.message });
    next(error);
  }
};

