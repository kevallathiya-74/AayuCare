/**
 * Notification Routes
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes (all users)
router.use(protect);

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all notifications
router.delete('/clear-all', notificationController.clearAllNotifications);

// Admin routes
router.post('/', authorize('admin'), notificationController.createNotification);
router.post('/broadcast', authorize('admin'), notificationController.broadcastNotification);

module.exports = router;
