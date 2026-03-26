const legacyAdminController = require("../../controllers/adminController");
const adminService = require("./admin.service");

exports.getDashboardStats = (req, res, next) => legacyAdminController.getDashboardStats(req, res, next);
exports.getRecentActivities = (req, res, next) => legacyAdminController.getRecentActivities(req, res, next);
exports.getUsers = (req, res, next) => legacyAdminController.getUsers(req, res, next);
exports.updateUserStatus = (req, res, next) => legacyAdminController.updateUserStatus(req, res, next);
exports.updateUserRole = (req, res, next) => legacyAdminController.updateUserRole(req, res, next);
exports.bulkUpdateUsers = (req, res, next) => legacyAdminController.bulkUpdateUsers(req, res, next);
exports.getSystemHealth = (req, res, next) => legacyAdminController.getSystemHealth(req, res, next);
exports.getSecuritySettings = (req, res, next) => legacyAdminController.getSecuritySettings(req, res, next);
exports.changePassword = (req, res, next) => legacyAdminController.changePassword(req, res, next);
exports.logoutAllDevices = (req, res, next) => legacyAdminController.logoutAllDevices(req, res, next);
exports.getMedicalRecordsOverview = (req, res, next) => legacyAdminController.getMedicalRecordsOverview(req, res, next);
exports.getSystemMetrics = (req, res, next) => legacyAdminController.getSystemMetrics(req, res, next);
exports.getNotificationsManagement = (req, res, next) => legacyAdminController.getNotificationsManagement(req, res, next);
exports.createUser = (req, res, next) => legacyAdminController.createUser(req, res, next);
exports.updateUserProfile = (req, res, next) => legacyAdminController.updateUserProfile(req, res, next);
exports.deleteUser = (req, res, next) => legacyAdminController.deleteUser(req, res, next);
exports.permanentDeleteUser = (req, res, next) => legacyAdminController.permanentDeleteUser(req, res, next);
exports.getAuditLogs = (req, res, next) => legacyAdminController.getAuditLogs(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = adminService;