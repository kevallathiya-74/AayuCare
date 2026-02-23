/**
 * Notification Routes
 */

const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/auth");
const { validateBody } = require("../middleware/validation");
const { createNotificationSchema, broadcastNotificationSchema } = require("../validators/schemas");
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

// Mark all as read
router.put(
  "/mark-all-read",
  notificationController.markAllAsRead
  // Cache invalidation now handled inside controller
);

// Mark notification as read
router.put(
  "/:id/read",
  notificationController.markAsRead
  // Cache invalidation now handled inside controller
);

// Clear all notifications
router.delete(
  "/clear-all",
  notificationController.clearAllNotifications
  // Cache invalidation now handled inside controller
);

// Delete notification
router.delete(
  "/:id",
  notificationController.deleteNotification
  // Cache invalidation now handled inside controller
);

// Admin routes
router.post(
  "/",
  authorize("admin"),
  validateBody(createNotificationSchema),
  notificationController.createNotification
  // Cache invalidation now handled inside controller
);
router.post(
  "/broadcast",
  authorize("admin"),
  validateBody(broadcastNotificationSchema),
  notificationController.broadcastNotification
  // Cache invalidation now handled inside controller
);

module.exports = router;
