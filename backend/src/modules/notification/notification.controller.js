const legacyNotificationController = require("../../controllers/notificationController");
const notificationService = require("./notification.service");

exports.getUserNotifications = (req, res, next) => legacyNotificationController.getUserNotifications(req, res, next);
exports.getUnreadCount = (req, res, next) => legacyNotificationController.getUnreadCount(req, res, next);
exports.markAllAsRead = (req, res, next) => legacyNotificationController.markAllAsRead(req, res, next);
exports.markAsRead = (req, res, next) => legacyNotificationController.markAsRead(req, res, next);
exports.clearAllNotifications = (req, res, next) => legacyNotificationController.clearAllNotifications(req, res, next);
exports.deleteNotification = (req, res, next) => legacyNotificationController.deleteNotification(req, res, next);
exports.createNotification = (req, res, next) => legacyNotificationController.createNotification(req, res, next);
exports.broadcastNotification = (req, res, next) => legacyNotificationController.broadcastNotification(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = notificationService;