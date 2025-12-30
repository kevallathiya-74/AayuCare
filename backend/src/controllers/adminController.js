/**
 * Admin Controller
 * Handles admin dashboard stats, user management, and system operations
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const MedicalRecord = require("../models/MedicalRecord");
const logger = require("../utils/logger");

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Private (Admin only)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run all queries in parallel for performance
    const [
      totalAppointments,
      appointmentsToday,
      pendingAppointments,
      completedAppointments,
      totalDoctors,
      activeDoctors,
      totalPatients,
      newPatientsThisMonth,
      totalPrescriptions,
      prescriptionsToday,
    ] = await Promise.all([
      // Appointment stats
      Appointment.countDocuments(),
      Appointment.countDocuments({
        appointmentDate: { $gte: today, $lt: tomorrow },
      }),
      Appointment.countDocuments({
        status: { $in: ["scheduled", "confirmed"] },
      }),
      Appointment.countDocuments({
        status: "completed",
      }),
      // Doctor stats
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "doctor", isActive: true }),
      // Patient stats
      User.countDocuments({ role: "patient" }),
      User.countDocuments({
        role: "patient",
        createdAt: { $gte: new Date(new Date().setDate(1)) }, // First of this month
      }),
      // Prescription stats
      Prescription.countDocuments(),
      Prescription.countDocuments({
        createdAt: { $gte: today },
      }),
    ]);

    res.json({
      success: true,
      data: {
        appointments: {
          total: totalAppointments,
          today: appointmentsToday,
          pending: pendingAppointments,
          completed: completedAppointments,
          trend: 0, // Can be calculated from historical data
        },
        doctors: {
          total: totalDoctors,
          active: activeDoctors,
          onDuty: activeDoctors, // Can be enhanced with shift tracking
          trend: 0,
        },
        patients: {
          total: totalPatients,
          new: newPatientsThisMonth,
          returning: totalPatients - newPatientsThisMonth,
          trend: 0,
        },
        prescriptions: {
          total: totalPrescriptions,
          today: prescriptionsToday,
          trend: 0,
        },
        revenue: { total: 0, today: 0, trend: 0 }, // Placeholder for billing module
      },
    });
  } catch (error) {
    logger.error("Dashboard stats error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Get recent activities
 * @route   GET /api/admin/activities
 * @access  Private (Admin only)
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent appointments
    const recentAppointments = await Appointment.find()
      .populate("patientId", "name userId")
      .populate("doctorId", "name userId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get recent prescriptions
    const recentPrescriptions = await Prescription.find()
      .populate("doctorId", "name userId")
      .populate("patientId", "name userId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Combine and format activities
    const activities = [
      ...recentAppointments.map((apt) => ({
        id: apt._id,
        text: `${apt.doctorId?.name || "Doctor"} scheduled appointment with ${
          apt.patientId?.name || "patient"
        }`,
        icon: "calendar",
        time: apt.createdAt,
        type: "appointment",
      })),
      ...recentPrescriptions.map((presc) => ({
        id: presc._id,
        text: `${
          presc.doctorId?.name || "Doctor"
        } added prescription for patient`,
        icon: "document-text",
        time: presc.createdAt,
        type: "prescription",
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit)
      .map((activity) => ({
        ...activity,
        time: getTimeAgo(activity.time),
      }));

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    logger.error("Recent activities error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activities",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      // Sanitize regex to prevent injection
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { email: { $regex: sanitizedSearch, $options: "i" } },
        { userId: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("Get users error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PATCH /api/admin/users/:userId/status
 * @access  Private (Admin only)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Log admin action
    logger.info("User status updated", {
      adminId: req.user.userId,
      targetUserId: userId,
      isActive,
    });

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    logger.error("Update user status error:", {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

/**
 * @desc    Update user role (with optimistic locking)
 * @route   PATCH /api/admin/users/:userId/role
 * @access  Private (Admin only)
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, version } = req.body;

    const validRoles = ["patient", "doctor", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Find user and check version for optimistic locking
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Optimistic locking check
    if (version !== undefined && user.__v !== version) {
      return res.status(409).json({
        success: false,
        message:
          "User was modified by another admin. Please refresh and try again.",
        currentVersion: user.__v,
      });
    }

    // Prevent demoting the last admin
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot demote the last admin. Promote another user first.",
        });
      }
    }

    user.role = role;
    await user.save();

    // Log admin action
    logger.info("User role updated", {
      adminId: req.user.userId,
      targetUserId: userId,
      oldRole: user.role,
      newRole: role,
    });

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    logger.error("Update user role error:", {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk update users (transactional)
 * @route   POST /api/admin/users/bulk
 * @access  Private (Admin only)
 */
exports.bulkUpdateUsers = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const { operations } = req.body;

    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Operations must be a non-empty array",
      });
    }

    if (operations.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Maximum 100 operations allowed per batch",
      });
    }

    const results = [];

    for (const op of operations) {
      const { userId, action, data } = op;

      let result;
      switch (action) {
        case "activate":
          result = await User.findByIdAndUpdate(
            userId,
            { isActive: true },
            { session, new: true }
          );
          break;
        case "deactivate":
          result = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { session, new: true }
          );
          break;
        case "updateRole":
          result = await User.findByIdAndUpdate(
            userId,
            { role: data.role },
            { session, new: true, runValidators: true }
          );
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      results.push({ userId, action, success: !!result });
    }

    await session.commitTransaction();

    // Log bulk operation
    logger.info("Bulk user update completed", {
      adminId: req.user.userId,
      operationsCount: operations.length,
    });

    res.json({
      success: true,
      message: `Successfully processed ${operations.length} operations`,
      data: results,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Bulk update error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Bulk update failed. All changes have been rolled back.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get system health
 * @route   GET /api/admin/system/health
 * @access  Private (Admin only)
 */
exports.getSystemHealth = async (req, res) => {
  try {
    // Properly access MongoDB connection through mongoose
    const dbStatus = await mongoose.connection.db.admin().ping();

    res.json({
      success: true,
      data: {
        status: "healthy",
        database: dbStatus?.ok === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    logger.error("System health check error:", { error: error.message });
    res.status(500).json({
      success: false,
      data: {
        status: "degraded",
        database: "error",
        error: error.message,
      },
    });
  }
};

/**
 * @desc    Get security settings and statistics
 * @route   GET /api/admin/security
 * @access  Private (Admin only)
 */
exports.getSecuritySettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get current user security info
    const user = await User.findOne({ userId }).select(
      'tokenVersion lastLogin isVerified createdAt revokedTokens'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get security statistics
    const [
      totalActiveSessions,
      recentLoginAttempts,
      totalUsers,
      verifiedUsers,
    ] = await Promise.all([
      // Active sessions (users with tokens not revoked)
      User.countDocuments({ 
        isActive: true,
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }),
      // Recent login attempts (users who logged in today)
      User.countDocuments({
        lastLogin: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        }
      }),
      // Total users
      User.countDocuments(),
      // Verified users
      User.countDocuments({ isVerified: true }),
    ]);

    res.json({
      success: true,
      data: {
        user: {
          tokenVersion: user.tokenVersion,
          lastLogin: user.lastLogin,
          isVerified: user.isVerified,
          accountCreated: user.createdAt,
          revokedTokensCount: user.revokedTokens?.length || 0,
        },
        statistics: {
          activeSessions: totalActiveSessions,
          recentLogins: recentLoginAttempts,
          totalUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
          twoFactorEnabled: false, // Placeholder for future 2FA feature
        },
        lastActivity: user.lastLogin ? getTimeAgo(user.lastLogin) : 'Never',
      },
    });
  } catch (error) {
    logger.error('Security settings error:', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security settings',
    });
  }
};

/**
 * @desc    Change password
 * @route   POST /api/admin/security/change-password
 * @access  Private (Admin only)
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters',
      });
    }

    // Get user with password field
    const user = await User.findOne({ userId }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    user.tokenVersion += 1; // Invalidate all existing tokens
    await user.save();

    logger.info(`Password changed for user: ${userId}`);

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    logger.error('Change password error:', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
};

/**
 * @desc    Logout from all devices
 * @route   POST /api/admin/security/logout-all
 * @access  Private (Admin only)
 */
exports.logoutAllDevices = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Increment token version to invalidate all tokens
    user.tokenVersion += 1;
    user.refreshToken = null;
    await user.save();

    logger.info(`Logged out all devices for user: ${userId}`);

    res.json({
      success: true,
      message: 'Successfully logged out from all devices',
    });
  } catch (error) {
    logger.error('Logout all devices error:', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to logout from all devices',
    });
  }
};

// Helper function
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
