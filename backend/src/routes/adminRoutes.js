/**
 * Admin Routes
 * All routes require authentication and admin role
 */

const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getRecentActivities,
    getUsers,
    updateUserStatus,
    updateUserRole,
    bulkUpdateUsers,
    getSystemHealth,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/activities', getRecentActivities);

// User management routes
router.get('/users', getUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.patch('/users/:userId/role', updateUserRole);
router.post('/users/bulk', bulkUpdateUsers);

// System routes
router.get('/system/health', getSystemHealth);

module.exports = router;
