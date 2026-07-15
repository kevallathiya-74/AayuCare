const { sendSuccess } = require("../../utils/apiResponse");
/**
 * Admin Controller
 * Handles admin dashboard stats, user management, and system operations
 */

const adminService = require("./admin.service");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const data = await adminService.getDashboardStats({
      hospitalId: req.hospitalId,
      role: req.user.role,
    });
    return sendSuccess(res, 200, "Dashboard stats retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};

exports.getRecentActivities = async (req, res, next) => {
  try {
    const limit = Math.max(
      1,
      Math.min(parseInt(req.query.limit, 10) || 10, 100),
    );
    const data = await adminService.getRecentActivities(limit, {
      hospitalId: req.hospitalId,
      role: req.user.role,
    });
    return sendSuccess(res, 200, "Recent activities retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(parseInt(req.query.limit, 10) || 20, 100),
    );
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
    const totalPages = Math.ceil(data.total / limit);
    const responseData = {
      ...data,
      data: data.users,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
    return sendSuccess(res, 200, "Users retrieved successfully", responseData);
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const data = await adminService.updateUserStatus({
      userId: req.params.userId,
      isActive: req.body.isActive,
      adminUser: req.user,
      hospitalId: req.hospitalId,
    });
    return sendSuccess(res, 200, `User ${req.body.isActive ? "activated" : "deactivated"} successfully`, data);
  } catch (e) {
    next(e);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const data = await adminService.updateUserRole({
      userId: req.params.userId,
      role: req.body.role,
      adminUser: req.user,
      hospitalId: req.hospitalId,
    });
    return sendSuccess(res, 200, `User role updated to ${req.body.role} successfully`, data);
  } catch (e) {
    next(e);
  }
};

exports.bulkUpdateUsers = async (req, res, next) => {
  try {
    const data = await adminService.bulkUpdateUsers({
      operations: req.body.operations,
      adminUser: req.user,
      hospitalId: req.hospitalId,
    });
    return sendSuccess(res, 200, `Successfully processed ${req.body.operations.length} operations`, data);
  } catch (e) {
    next(e);
  }
};

exports.getSystemHealth = async (req, res, next) => {
  try {
    const data = await adminService.getSystemHealth();
    return sendSuccess(res, 200, "System health retrieved successfully", data);
  } catch (e) {
    next(e);
  }
};

exports.getSecuritySettings = async (req, res, next) => {
  try {
    const data = await adminService.getSecuritySettings(req.user.userId, {
      hospitalId: req.hospitalId,
      role: req.user.role,
    });
    return sendSuccess(res, 200, "Security settings retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const data = await adminService.changePassword({
      userId: req.user.userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    return sendSuccess(res, 200, "Password changed successfully", data);
  } catch (e) {
    next(e);
  }
};

exports.logoutAllDevices = async (req, res, next) => {
  try {
    const data = await adminService.logoutAllDevices(req.user.userId);
    return sendSuccess(res, 200, "Logged out from all devices successfully", data);
  } catch (e) {
    next(e);
  }
};

exports.getMedicalRecordsOverview = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const data = await adminService.getMedicalRecordsOverview({
      patientId,
      limit,
      skip,
      ctx: { hospitalId: req.hospitalId, role: req.user.role },
    });
    return sendSuccess(res, 200, "Medical records overview retrieved successfully", data);
  } catch (e) {
    next(e);
  }
};

exports.getSystemMetrics = async (req, res, next) => {
  try {
    const data = await adminService.getSystemMetrics({
      hospitalId: req.hospitalId,
      role: req.user.role,
    });
    return sendSuccess(res, 200, "System metrics retrieved successfully", data);
  } catch (e) {
    next(e);
  }
};

exports.getNotificationsManagement = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const data = await adminService.getNotificationsManagement({
      type,
      status,
      limit,
      skip,
      ctx: { hospitalId: req.hospitalId, role: req.user.role },
    });
    return sendSuccess(res, 200, "Notifications retrieved successfully", data);
  } catch (e) {
    next(e);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const data = await adminService.createUser(req);
    return sendSuccess(res, 201, "User created successfully", data.user);
  } catch (e) {
    next(e);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const data = await adminService.updateUserProfile(req);
    return sendSuccess(res, 200, "User profile updated successfully", data.user);
  } catch (e) {
    next(e);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const data = await adminService.deleteUser(req);
    return sendSuccess(res, 200, "User deleted successfully", data);
  } catch (e) {
    next(e);
  }
};

exports.permanentDeleteUser = async (req, res, next) => {
  try {
    const data = await adminService.permanentDeleteUser(req);
    return sendSuccess(res, 200, "User permanently deleted successfully", data);
  } catch (e) {
    next(e);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { userId, action, entityType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const data = await adminService.getAuditLogs({
      userId,
      action,
      entityType,
      limit,
      page,
      ctx: { hospitalId: req.hospitalId, role: req.user.role },
    });
    return sendSuccess(res, 200, "Audit logs retrieved successfully", data);
  } catch (e) {
    next(e);
  }
};
