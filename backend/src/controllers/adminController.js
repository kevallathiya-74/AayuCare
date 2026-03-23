/**
 * Admin Controller
 * Handles admin dashboard stats, user management, and system operations
 */

const mongoose = require("mongoose");
const { AppError } = require("../middleware/errorHandler");
const userRepository = require("../repositories/userRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const doctorRepository = require("../repositories/doctorRepository");
const patientRepository = require("../repositories/patientRepository");
const medicalRecordRepository = require("../repositories/medicalRecordRepository");
const notificationRepository = require("../repositories/notificationRepository");
const logger = require("../utils/logger");
const { query } = require("../config/postgres");
const { redisClient, deleteCacheByPattern } = require("../config/redis");
const { withTransaction } = require("../utils/transaction");
const { writeAuditLog, AUDIT_ACTIONS } = require("../utils/audit");

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Private (Admin only)
 */
const adminService = require("../services/adminService");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const data = await adminService.getDashboardStats({
      hospitalId: req.hospitalId,
      role: req.user.role,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent activities
 * @route   GET /api/admin/activities
 * @access  Private (Admin only)
 */
exports.getRecentActivities = async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 10, 100));
    const data = await adminService.getRecentActivities(limit, {
      hospitalId: req.hospitalId,
      role: req.user.role,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100));
    const data = await adminService.getUsers({
      role: req.query.role,
      search: req.query.search,
      includeInactive: req.query.includeInactive,
      page,
      limit,
      ctx: {
        hospitalId: req.hospitalId,
        role: req.user.role,
      },
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PATCH /api/admin/users/:userId/status
 * @access  Private (Admin only)
 */
exports.updateUserStatus = async (req, res, next) => {
  try { const data = await adminService.updateUserStatus({ userId: req.params.userId, isActive: req.body.isActive, adminUser: req.user, hospitalId: req.hospitalId }); res.json({ success: true, message: `User ${req.body.isActive ? 'activated' : 'deactivated'} successfully`, data }); } catch(e) { next(e); }
};

/**
 * @desc    Update user role (with optimistic locking)
 * @route   PATCH /api/admin/users/:userId/role
 * @access  Private (Admin only)
 */
exports.updateUserRole = async (req, res, next) => {
  try { const data = await adminService.updateUserRole({ userId: req.params.userId, role: req.body.role, adminUser: req.user, hospitalId: req.hospitalId }); res.json({ success: true, message: `User role updated to ${req.body.role} successfully`, data }); } catch(e) { next(e); }
};

/**
 * @desc    Bulk update users (transactional)
 * @route   POST /api/admin/users/bulk
 * @access  Private (Admin only)
 */
exports.bulkUpdateUsers = async (req, res, next) => {
  try { const data = await adminService.bulkUpdateUsers({ operations: req.body.operations, adminUser: req.user, hospitalId: req.hospitalId }); res.json({ success: true, message: `Successfully processed ${req.body.operations.length} operations`, data }); } catch(e) { next(e); }
};

/**
 * @desc    Get system health
 * @route   GET /api/admin/system/health
 * @access  Private (Admin only)
 */
exports.getSystemHealth = async (req, res, next) => {
  try { const data = await adminService.getSystemHealth(); res.json(data); } catch(e) { next(e); }
};

/**
 * @desc    Get security settings and statistics
 * @route   GET /api/admin/security
 * @access  Private (Admin only)
 */
exports.getSecuritySettings = async (req, res, next) => {
  try {
    const data = await adminService.getSecuritySettings(req.user.userId, {
      hospitalId: req.hospitalId,
      role: req.user.role
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   POST /api/admin/security/change-password
 * @access  Private (Admin only)
 */
exports.changePassword = async (req, res, next) => {
  try { const data = await adminService.changePassword({ userId: req.user.userId, currentPassword: req.body.currentPassword, newPassword: req.body.newPassword }); res.json({ success: true, message: 'Password changed successfully', data }); } catch(e) { next(e); }
};

/**
 * @desc    Logout from all devices
 * @route   POST /api/admin/security/logout-all
 * @access  Private (Admin only)
 */
exports.logoutAllDevices = async (req, res, next) => {
  try { const data = await adminService.logoutAllDevices(req.user.userId); res.json({ success: true, message: 'Logged out from all devices successfully', data }); } catch(e) { next(e); }
};

/**
 * @desc    Get medical records overview (metadata only)
 * @route   GET /api/admin/medical-records
 * @access  Private (Admin only)
 */
exports.getMedicalRecordsOverview = async (req, res, next) => {
  try { const { patientId } = req.query; const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || 10; const skip = (page - 1) * limit; const data = await adminService.getMedicalRecordsOverview({ patientId, limit, skip, ctx: { hospitalId: req.hospitalId, role: req.user.role } }); res.json({ success: true, data }); } catch(e) { next(e); }
};

/**
 * @desc    Get system metrics and aggregations
 * @route   GET /api/admin/system/metrics
 * @access  Private (Admin only)
 */
exports.getSystemMetrics = async (req, res, next) => {
  try { const data = await adminService.getSystemMetrics({ hospitalId: req.hospitalId, role: req.user.role }); res.json({ success: true, data }); } catch(e) { next(e); }
};

/**
 * @desc    Get notifications for management
 * @route   GET /api/admin/notifications/manage
 * @access  Private (Admin only)
 */
exports.getNotificationsManagement = async (req, res, next) => {
  try { const { type, status } = req.query; const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || 10; const skip = (page - 1) * limit; const data = await adminService.getNotificationsManagement({ type, status, limit, skip, ctx: { hospitalId: req.hospitalId, role: req.user.role } }); res.json({ success: true, data }); } catch(e) { next(e); }
};

/**
 * @desc    Create new user (doctor or patient)
 * @route   POST /api/admin/users
 * @access  Private (Admin only)
 */
exports.createUser = async (req, res, next) => {
  try { const data = await adminService.createUser(req); res.status(201).json({ success: true, message: 'User created successfully', data: data.user }); } catch(e) { next(e); }
};

/**
 * @desc    Update user profile (full update)
 * @route   PUT /api/admin/users/:userId
 * @access  Private (Admin only)
 */
exports.updateUserProfile = async (req, res, next) => {
  try { const data = await adminService.updateUserProfile(req); res.json({ success: true, message: 'User profile updated successfully', data: data.user }); } catch(e) { next(e); }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/admin/users/:userId
 * @access  Private (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try { const data = await adminService.deleteUser(req); res.json({ success: true, message: 'User deleted successfully', data: data }); } catch(e) { next(e); }
};

/**
 * @desc    PERMANENT delete user (hard delete - removes all data)
 * @route   DELETE /api/admin/users/:userId/permanent
 * @access  Private (Admin only)
 * @warning This violates healthcare compliance regulations (HIPAA) - use with EXTREME caution
 * @param   {string} req.params.userId - User ID to permanently delete
 * @returns {Object} Success message with deletion details
 * 
 * @security
 * - Requires admin or super_admin role
 * - Validates hospital access (multi-tenancy)
 * - Prevents deletion of admin/super_admin users
 * - Checks for active appointments (doctors only)
 * - All operations wrapped in database transaction
 * - Comprehensive audit logging at WARN level
 * 
 * @compliance
 * WARNING: Permanent deletion violates healthcare data retention regulations.
 * This action:
 * - Removes all patient medical records (HIPAA violation)
 * - Deletes appointment history
 * - Removes prescription records
 * - Cannot be reversed
 * - Is logged for audit purposes
 */
exports.permanentDeleteUser = async (req, res, next) => {
  try { const data = await adminService.permanentDeleteUser(req); res.json({ success: true, message: 'User permanently deleted successfully', data: data }); } catch(e) { next(e); }
};

/**
 * Convert a date to a short human-readable relative time string.
 * @param {Date|string|number} date - Date, ISO string, or timestamp to compare against current time.
 * @returns {string} A relative time string: "just now", "<n> mins ago", "<n> hours ago", or "<n> days ago".
 */
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

/**
 * @desc    Get audit logs with optional filtering and pagination
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin, super_admin)
 */
exports.getAuditLogs = async (req, res, next) => {
  try { const { userId, action, entityType } = req.query; const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || 20; const data = await adminService.getAuditLogs({ userId, action, entityType, limit, page, ctx: { hospitalId: req.hospitalId, role: req.user.role } }); res.json({ success: true, data }); } catch(e) { next(e); }
};

