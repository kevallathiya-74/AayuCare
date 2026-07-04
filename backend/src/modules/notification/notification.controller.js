/**
 * Notification Controller
 * Handles notification CRUD operations and user notifications
 */

const notificationRepository = require("./notification.repository");
const logger = require("../../utils/logger");
const {
  invalidateAfterNotificationMutation,
  invalidateAfterNotificationBroadcastMutation,
} = require("../../utils/cacheInvalidation");
const { AppError } = require("../../middleware/errorHandler");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

// Resolve user's UUID string id from the authenticated request
const resolveUserId = (req) =>
  req.user?.id;

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
      return next(new AppError("Authentication required to fetch notifications", 401));
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

    return sendSuccess(
      res,
      req,
      {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
        unreadCount,
      },
      "Notifications retrieved successfully"
    );
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

    return sendSuccess(res, req, { count }, "Unread notification count retrieved successfully");
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
      return sendError(res, req, "Invalid user context for notifications", 400, "VALIDATION_ERROR");
    }

    const notification = await notificationRepository.findById(id);

    if (!notification || notification.userId !== userId) {
      return sendError(res, req, "Notification not found", 404, "NOT_FOUND");
    }

    await notificationRepository.markAsRead(id, userId);

    // Refetch to return the updated document
    const updatedNotification = await notificationRepository.findById(id);

    // Invalidate relevant caches after notification update
    try {
      await invalidateAfterNotificationMutation();
      logger.debug("Cache invalidated after notification marked as read");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, updatedNotification, "Notification marked as read");
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
      return sendError(res, req, "Invalid user context for notifications", 400, "VALIDATION_ERROR");
    }

    const result = await notificationRepository.markAllAsRead(userId);

    // Invalidate relevant caches after marking all as read
    try {
      await invalidateAfterNotificationMutation();
      logger.debug("Cache invalidated after marking all notifications as read");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, { updated: result.rowCount }, "All notifications marked as read");
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
      return sendError(res, req, "Invalid user context for notifications", 400, "VALIDATION_ERROR");
    }

    const result = await notificationRepository.delete(id, userId);

    if (!result) {
      return sendError(res, req, "Notification not found", 404, "NOT_FOUND");
    }

    // Invalidate relevant caches after notification deletion
    try {
      await invalidateAfterNotificationMutation();
      logger.debug("Cache invalidated after notification deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, {}, "Notification deleted successfully");
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
      return sendError(res, req, "Invalid user context for notifications", 400, "VALIDATION_ERROR");
    }

    const result = await notificationRepository.deleteAllForUser(userId);

    // Invalidate relevant caches after clearing all notifications
    try {
      await invalidateAfterNotificationMutation();
      logger.debug("Cache invalidated after clearing all notifications");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, { deleted: result.rowCount }, "All notifications cleared");
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
      return sendError(res, req, "userId is required", 400, "VALIDATION_ERROR");
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return sendError(res, req, "title is required", 400, "VALIDATION_ERROR");
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return sendError(res, req, "message is required", 400, "VALIDATION_ERROR");
    }

    const notification = await notificationRepository.create({
      userId,
      title,
      body: message,
      type: type || "system",
      priority: priority || "medium",
      data,
      actionUrl,
      icon,
      hospitalId: req.hospitalId || req.user?.hospitalId,
    });

    // Invalidate relevant caches after notification creation
    try {
      await invalidateAfterNotificationBroadcastMutation();
      logger.debug("Cache invalidated after notification creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, notification, "Notification created successfully", 201);
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
      return sendError(res, req, "Please provide an array of user IDs", 400, "VALIDATION_ERROR");
    }

    if (userIds.length > 1000) {
      return sendError(res, req, "Cannot broadcast to more than 1000 recipients per request", 400, "VALIDATION_ERROR");
    }

    if (!title || !message) {
      return sendError(res, req, "title and message are required", 400, "VALIDATION_ERROR");
    }

    const hospitalId = req.hospitalId || req.user?.hospitalId;
    const notifications = userIds.map((userId) => ({
      userId,
      title,
      body: message,
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
      await invalidateAfterNotificationBroadcastMutation();
      logger.debug("Cache invalidated after broadcast notification");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(
      res,
      req,
      { count: result.length },
      `Notification sent to ${result.length} users`,
      201
    );
  } catch (error) {
    logger.error("Broadcast notification error:", { error: error.message });
    next(error);
  }
};

