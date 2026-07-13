/**
 * Admin Controller
 * Handles admin dashboard stats, user management, and system operations
 */

const adminService = require("./admin.service");
const { sendSuccess } = require("../../utils/apiResponse");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const data = await adminService.getDashboardStats({
      hospitalId: req.hospitalId,
      role: req.user.role,
    });
    return sendSuccess(
      res,
      req,
      data,
      "Dashboard stats retrieved successfully",
    );
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
    return sendSuccess(
      res,
      req,
      data,
      "Recent activities retrieved successfully",
    );
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
    return sendSuccess(res, req, responseData, "Users retrieved successfully");
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
    return sendSuccess(
      res,
      req,
      data,
      `User ${req.body.isActive ? "activated" : "deactivated"} successfully`,
    );
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
    return sendSuccess(
      res,
      req,
      data,
      `User role updated to ${req.body.role} successfully`,
    );
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
    return sendSuccess(
      res,
      req,
      data,
      `Successfully processed ${req.body.operations.length} operations`,
    );
  } catch (e) {
    next(e);
  }
};

exports.getSystemHealth = async (req, res, next) => {
  try {
    const data = await adminService.getSystemHealth();
    return sendSuccess(res, req, data, "System health retrieved successfully");
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
    return sendSuccess(
      res,
      req,
      data,
      "Security settings retrieved successfully",
    );
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
    return sendSuccess(res, req, data, "Password changed successfully");
  } catch (e) {
    next(e);
  }
};

exports.logoutAllDevices = async (req, res, next) => {
  try {
    const data = await adminService.logoutAllDevices(req.user.userId);
    return sendSuccess(
      res,
      req,
      data,
      "Logged out from all devices successfully",
    );
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
    return sendSuccess(
      res,
      req,
      data,
      "Medical records overview retrieved successfully",
    );
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
    return sendSuccess(res, req, data, "System metrics retrieved successfully");
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
    return sendSuccess(res, req, data, "Notifications retrieved successfully");
  } catch (e) {
    next(e);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const data = await adminService.createUser(req);
    return sendSuccess(res, req, data.user, "User created successfully", 201);
  } catch (e) {
    next(e);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const data = await adminService.updateUserProfile(req);
    return sendSuccess(
      res,
      req,
      data.user,
      "User profile updated successfully",
    );
  } catch (e) {
    next(e);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const data = await adminService.deleteUser(req);
    return sendSuccess(res, req, data, "User deleted successfully");
  } catch (e) {
    next(e);
  }
};

exports.permanentDeleteUser = async (req, res, next) => {
  try {
    const data = await adminService.permanentDeleteUser(req);
    return sendSuccess(res, req, data, "User permanently deleted successfully");
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
    return sendSuccess(res, req, data, "Audit logs retrieved successfully");
  } catch (e) {
    next(e);
  }
};
