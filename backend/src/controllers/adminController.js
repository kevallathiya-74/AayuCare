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

    // Build base query with hospitalId filter (skip for super_admin)
    const baseQuery = {};
    if (req.hospitalId && req.user.role !== "super_admin") {
      baseQuery.hospitalId = req.hospitalId;
    }

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
      Appointment.countDocuments(baseQuery),
      Appointment.countDocuments({
        ...baseQuery,
        appointmentDate: { $gte: today, $lt: tomorrow },
      }),
      Appointment.countDocuments({
        ...baseQuery,
        status: { $in: ["scheduled", "confirmed"] },
      }),
      Appointment.countDocuments({
        ...baseQuery,
        status: "completed",
      }),
      // Doctor stats
      User.countDocuments({ ...baseQuery, role: "doctor" }),
      User.countDocuments({ ...baseQuery, role: "doctor", isActive: true }),
      // Patient stats
      User.countDocuments({ ...baseQuery, role: "patient" }),
      User.countDocuments({
        ...baseQuery,
        role: "patient",
        createdAt: { $gte: new Date(new Date().setDate(1)) }, // First of this month
      }),
      // Prescription stats
      Prescription.countDocuments(baseQuery),
      Prescription.countDocuments({
        ...baseQuery,
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

    // Build base query with hospitalId filter (skip for super_admin)
    const baseQuery = {};
    if (req.hospitalId && req.user.role !== "super_admin") {
      baseQuery.hospitalId = req.hospitalId;
    }

    // Get recent appointments
    const recentAppointments = await Appointment.find(baseQuery)
      .populate("patientId", "name userId")
      .populate("doctorId", "name userId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get recent prescriptions
    const recentPrescriptions = await Prescription.find(baseQuery)
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

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      query.hospitalId = req.hospitalId;
    }
    
    // Debug logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('[getUsers] Query:', JSON.stringify(query));
      console.log('[getUsers] req.hospitalId:', req.hospitalId);
      console.log('[getUsers] req.user.role:', req.user?.role);
    }

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
    
    // Debug logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('[getUsers] Found:', users.length, 'users out of', total);
    }

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

/**
 * @desc    Get medical records overview (metadata only)
 * @route   GET /api/admin/medical-records
 * @access  Private (Admin only)
 */
exports.getMedicalRecordsOverview = async (req, res) => {
  try {
    const { page = 1, limit = 20, patientId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    // Add hospitalId filter for multi-tenancy
    if (req.hospitalId && req.user.role !== "super_admin") {
      query.hospitalId = req.hospitalId;
    }

    if (patientId) {
      query.patientId = patientId;
    }

    const [records, total] = await Promise.all([
      MedicalRecord.find(query)
        .select("recordType title patientId doctorId createdAt updatedAt hospitalId")
        .populate("patientId", "name userId")
        .populate("doctorId", "name specialization")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MedicalRecord.countDocuments(query),
    ]);

    // Aggregate by record type
    const typeStats = await MedicalRecord.aggregate([
      { $match: query },
      { $group: { _id: "$recordType", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        records,
        stats: typeStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error("Get medical records overview error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch medical records overview",
      error: error.message,
    });
  }
};

/**
 * @desc    Get system metrics and aggregations
 * @route   GET /api/admin/system/metrics
 * @access  Private (Admin only)
 */
exports.getSystemMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const baseQuery = {};
    if (req.hospitalId && req.user.role !== "super_admin") {
      baseQuery.hospitalId = req.hospitalId;
    }

    // Aggregate user growth
    const userGrowth = await User.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            role: "$role",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    // Appointment trends
    const appointmentTrends = await Appointment.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    // Active users (logged in within last 7 days)
    const activeUsers = await User.countDocuments({
      ...baseQuery,
      lastLoginAt: { $gte: weekAgo },
    });

    // Database size stats
    const dbStats = await mongoose.connection.db.stats();

    res.json({
      success: true,
      data: {
        userGrowth,
        appointmentTrends,
        activeUsers,
        database: {
          collections: dbStats.collections,
          dataSize: dbStats.dataSize,
          indexSize: dbStats.indexSize,
          storageSize: dbStats.storageSize,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Get system metrics error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch system metrics",
      error: error.message,
    });
  }
};

/**
 * @desc    Get notifications for management
 * @route   GET /api/admin/notifications/manage
 * @access  Private (Admin only)
 */
exports.getNotificationsManagement = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    // Add hospitalId filter for multi-tenancy
    if (req.hospitalId && req.user.role !== "super_admin") {
      query.hospitalId = req.hospitalId;
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.isRead = status === "read";
    }

    const Notification = require("../models/Notification");

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("userId", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, isRead: false }),
    ]);

    // Type distribution
    const typeStats = await Notification.aggregate([
      { $match: query },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        stats: {
          total,
          unreadCount,
          typeDistribution: typeStats,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error("Get notifications management error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * @desc    Create new user (doctor or patient)
 * @route   POST /api/admin/users
 * @access  Private (Admin only)
 */
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      specialization,
      qualification,
      experience,
      department,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        status: "error",
        message: "Name, email, phone, password, and role are required",
      });
    }

    // Validate role
    if (!["doctor", "patient"].includes(role)) {
      return res.status(400).json({
        status: "error",
        message: "Role must be either doctor or patient",
      });
    }

    // Role-specific validation
    if (role === "doctor") {
      if (!specialization || !qualification) {
        return res.status(400).json({
          status: "error",
          message: "Specialization and qualification are required for doctors",
        });
      }
    }

    // Check for duplicate email or phone
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message:
          existingUser.email === email.toLowerCase()
            ? "Email already exists"
            : "Phone number already exists",
      });
    }

    // Generate unique userId
    const prefix = role === "doctor" ? "DOC" : "PAT";
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0");
    const timeStr =
      now.getHours().toString().padStart(2, "0") +
      now.getMinutes().toString().padStart(2, "0") +
      now.getSeconds().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const userId = `${prefix}${dateStr}${timeStr}${random}`;

    // Prepare user data
    const userData = {
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role,
      isActive: true,
      hospitalId: req.hospitalId || req.user.hospitalId,
      hospitalName: req.user.hospitalName,
    };

    // Add role-specific fields
    if (role === "doctor") {
      userData.specialization = specialization;
      userData.qualification = qualification;
      userData.experience = experience || 0;
      userData.department = department || specialization;
      userData.consultationFee = 500; // Default
    } else if (role === "patient") {
      userData.dateOfBirth = dateOfBirth;
      userData.gender = gender;
      userData.bloodGroup = bloodGroup;
      userData.address = address;
    }

    // Create user
    const user = await User.create(userData);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`Admin ${req.user.userId} created new ${role}: ${userId}`);

    res.status(201).json({
      status: "success",
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
      data: { user: userResponse },
    });
  } catch (error) {
    logger.error("Create user error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: "error",
      message: "Failed to create user",
      error: error.message,
    });
  }
};

/**
 * @desc    Update user profile (full update)
 * @route   PUT /api/admin/users/:userId
 * @access  Private (Admin only)
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      phone,
      specialization,
      qualification,
      experience,
      department,
      consultationFee,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
    } = req.body;

    // Find user with hospitalId filter
    const query = { userId };
    if (req.hospitalId && req.user.role !== "super_admin") {
      query.hospitalId = req.hospitalId;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found or access denied",
      });
    }

    // Check for duplicate email or phone (if changed)
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });
      if (emailExists) {
        return res.status(400).json({
          status: "error",
          message: "Email already exists",
        });
      }
    }

    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({
        phone,
        _id: { $ne: user._id },
      });
      if (phoneExists) {
        return res.status(400).json({
          status: "error",
          message: "Phone number already exists",
        });
      }
    }

    // Update common fields
    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone.trim();

    // Update role-specific fields
    if (user.role === "doctor") {
      if (specialization) user.specialization = specialization;
      if (qualification) user.qualification = qualification;
      if (experience !== undefined) user.experience = experience;
      if (department) user.department = department;
      if (consultationFee !== undefined) user.consultationFee = consultationFee;
    } else if (user.role === "patient") {
      if (dateOfBirth) user.dateOfBirth = dateOfBirth;
      if (gender) user.gender = gender;
      if (bloodGroup) user.bloodGroup = bloodGroup;
      if (address) user.address = address;
    }

    user.updatedAt = new Date();
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`Admin ${req.user.userId} updated profile of ${userId}`);

    res.json({
      status: "success",
      message: "User profile updated successfully",
      data: { user: userResponse },
    });
  } catch (error) {
    logger.error("Update user profile error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: "error",
      message: "Failed to update user profile",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/admin/users/:userId
 * @access  Private (Admin only)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user with hospitalId filter
    const query = { userId };
    if (req.hospitalId && req.user.role !== "super_admin") {
      query.hospitalId = req.hospitalId;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found or access denied",
      });
    }

    // Prevent deleting admin users
    if (["admin", "super_admin"].includes(user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Cannot delete admin users",
      });
    }

    // Check for active appointments (for doctors)
    if (user.role === "doctor") {
      const activeAppointments = await Appointment.countDocuments({
        doctorId: user._id,
        status: { $in: ["scheduled", "confirmed"] },
        appointmentDate: { $gte: new Date() },
      });

      if (activeAppointments > 0) {
        return res.status(400).json({
          status: "error",
          message: `Cannot delete doctor with ${activeAppointments} active appointments. Please reschedule or cancel them first.`,
        });
      }
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    user.updatedAt = new Date();
    await user.save();

    logger.info(
      `Admin ${req.user.userId} soft-deleted user ${userId} (${user.role})`
    );

    res.json({
      status: "success",
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} deleted successfully`,
      data: {
        userId: user.userId,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error("Delete user error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: "error",
      message: "Failed to delete user",
      error: error.message,
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
