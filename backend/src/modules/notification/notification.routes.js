const express = require("express");
const router = express.Router();
const notificationController = require("./notification.controller");
const { protect, authorize } = require("../../middleware/auth");
const { validateBody, validateObjectId } = require("../../middleware/validation");
const {
  createNotificationSchema,
  broadcastNotificationSchema,
} = require("../../validators/schemas");
const { cacheMiddleware } = require("../../middleware/cache");

router.use(protect);

router.get("/", cacheMiddleware(10), notificationController.getUserNotifications);

router.get(
  "/unread-count",
  cacheMiddleware(10),
  notificationController.getUnreadCount
);

router.put("/mark-all-read", notificationController.markAllAsRead);

router.put("/:id/read", validateObjectId("id"), notificationController.markAsRead);

router.delete("/clear-all", notificationController.clearAllNotifications);

router.delete(
  "/:id",
  validateObjectId("id"),
  notificationController.deleteNotification
);

router.post(
  "/",
  authorize("admin"),
  validateBody(createNotificationSchema),
  notificationController.createNotification
);

router.post(
  "/broadcast",
  authorize("admin"),
  validateBody(broadcastNotificationSchema),
  notificationController.broadcastNotification
);

module.exports = router;