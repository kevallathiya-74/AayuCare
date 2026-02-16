/**
 * Notification Routes
 */

const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/auth");
const { validateBody } = require("../middleware/validation");
const { createNotificationSchema } = require("../validators/schemas");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");

// Protected routes (all users)
router.use(protect);

// Get user notifications
router.get(
  "/",
  cacheMiddleware(10),
  notificationController.getUserNotifications
);

// Get unread count
router.get(
  "/unread-count",
  cacheMiddleware(10),
  notificationController.getUnreadCount
);

// Mark notification as read
router.put(
  "/:id/read",
  notificationController.markAsRead,
  invalidateCache("cache:notification:*")
);

// Mark all as read
router.put(
  "/mark-all-read",
  notificationController.markAllAsRead,
  invalidateCache("cache:notification:*")
);

// Delete notification
router.delete(
  "/:id",
  notificationController.deleteNotification,
  invalidateCache("cache:notification:*")
);

// Clear all notifications
router.delete(
  "/clear-all",
  notificationController.clearAllNotifications,
  invalidateCache("cache:notification:*")
);

// Admin routes
router.post(
  "/",
  authorize("admin"),
  validateBody(createNotificationSchema),
  notificationController.createNotification,
  invalidateCache("cache:notification:*")
);
router.post(
  "/broadcast",
  authorize("admin"),
  validateBody(createNotificationSchema),
  notificationController.broadcastNotification,
  invalidateCache("cache:notification:*")
);

module.exports = router;
