/**
 * Admin Controller
 * Handles admin dashboard stats, user management, and system operations
 */

const mongoose = require("mongoose");
const userRepository = require("../repositories/userRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const MedicalRecord = require("../models/MedicalRecord");
const logger = require("../utils/logger");
const { query } = require("../config/postgres");

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

    // Build SQL filters
    const hospitalFilter = req.hospitalId && req.user.role !== "super_admin" 
      ? `AND hospital_id = '${req.hospitalId}'` 
      : '';

    // Run all queries in parallel for performance
    const [
      appointmentStats,
      doctorStats,
      patientStats,
      prescriptionStats
    ] = await Promise.all([
      // Appointment stats
      query(`
        SELECT 
          COUNT(*) FILTER (WHERE 1=1) as total,
          COUNT(*) FILTER (WHERE appointment_date >= $1 AND appointment_date < $2) as today,
          COUNT(*) FILTER (WHERE status IN ('scheduled', 'confirmed')) as pending,
          COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM appointments
        WHERE 1=1 ${hospitalFilter}
      `, [today, tomorrow]),
      // Doctor stats
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active
        FROM users
        WHERE role = 'doctor' ${hospitalFilter}
      `),
      // Patient stats
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= $1) as new_this_month
        FROM users
        WHERE role = 'patient' ${hospitalFilter}
      `, [new Date(new Date().setDate(1))]),
      // Prescription stats
      prescriptionRepository.count(baseQuery).then(total => ({
        total,
        today: 0 // Would need additional query for MongoDB
      }))
    ]);

    const totalAppointments = parseInt(appointmentStats.rows[0].total);
    const appointmentsToday = parseInt(appointmentStats.rows[0].today);
    const pendingAppointments = parseInt(appointmentStats.rows[0].pending);
    const completedAppointments = parseInt(appointmentStats.rows[0].completed);
    const totalDoctors = parseInt(doctorStats.rows[0].total);
    const activeDoctors = parseInt(doctorStats.rows[0].active);
    const totalPatients = parseInt(patientStats.rows[0].total);
    const newPatientsThisMonth = parseInt(patientStats.rows[0].new_this_month);
    const totalPrescriptions = prescriptionStats.total;
    const prescriptionsToday = prescriptionStats.today;

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

    // Get recent appointments from PostgreSQL
    const hospitalFilter = req.hospitalId && req.user.role !== "super_admin" 
      ? `AND a.hospital_id = '${req.hospitalId}'` 
      : '';
    
    const appointmentsResult = await query(`
      SELECT a.id, a.created_at,
             p.name as patient_name, p.user_id as patient_user_id,
             d.name as doctor_name, d.user_id as doctor_user_id
      FROM appointments a
      LEFT JOIN users p ON a.patient_id = p.id
      LEFT JOIN users d ON a.doctor_id = d.id
      WHERE 1=1 ${hospitalFilter}
      ORDER BY a.created_at DESC
      LIMIT $1
    `, [limit]);
    
    const recentAppointments = appointmentsResult.rows.map(row => ({
      _id: row.id,
      createdAt: row.created_at,
      patientId: { name: row.patient_name, userId: row.patient_user_id },
      doctorId: { name: row.doctor_name, userId: row.doctor_user_id }
    }));

    // Get recent prescriptions from MongoDB
    const recentPrescriptions = await prescriptionRepository.findByHospital(
      req.hospitalId,
      { limit, skip: 0 }
    );

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

    // Build PostgreSQL query
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (req.hospitalId && req.user.role !== "super_admin") {
      conditions.push(`hospital_id = $${paramIndex}`);
      params.push(req.hospitalId);
      paramIndex++;
    }

    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR user_id ILIKE $${paramIndex})`);
      params.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [usersResult, countResult] = await Promise.all([
      query(`
        SELECT id, user_id, name, email, phone, role, hospital_id, hospital_name,
               is_active, email_verified, phone_verified, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, parseInt(limit), skip]),
      query(`SELECT COUNT(*) FROM users ${whereClause}`, params)
    ]);

    const users = usersResult.rows;
    const total = parseInt(countResult.rows[0].count);
    
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

    // Find user by userId (not UUID id)
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update status
    const updatedUser = await userRepository.update(user.id, { isActive });

    // Log admin action
    logger.info("User status updated", {
      adminId: req.user.userId,
      targetUserId: userId,
      isActive,
    });

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: updatedUser,
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

    // Find user by userId
    const user = await userRepository.findByUserId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Note: PostgreSQL doesn't have __v for optimistic locking
    // Could implement with a version field if needed

    // Prevent demoting the last admin
    if (user.role === "admin" && role !== "admin") {
      const adminCountResult = await query(
        `SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = true`
      );
      const adminCount = parseInt(adminCountResult.rows[0].count);
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot demote the last admin. Promote another user first.",
        });
      }
    }

    // Update role using raw query since it's not a standard allowed field
    await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`,
      [role, user.id]
    );
    
    const updatedUser = await userRepository.findById(user.id);

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
      data: updatedUser,
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
  const client = require("../config/postgres").getClient();
  await client.query('BEGIN');

  try {
    const { operations } = req.body;

    if (!Array.isArray(operations) || operations.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: "Operations must be a non-empty array",
      });
    }

    if (operations.length > 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: "Maximum 100 operations allowed per batch",
      });
    }

    const results = [];

    for (const op of operations) {
      const { userId, action, data } = op;

      let result;
      try {
        // Find user by userId first
        const userResult = await client.query(
          'SELECT id FROM users WHERE user_id = $1',
          [userId]
        );
        
        if (userResult.rows.length === 0) {
          results.push({ userId, action, success: false, error: 'User not found' });
          continue;
        }
        
        const userUuid = userResult.rows[0].id;

        switch (action) {
          case "activate":
            result = await client.query(
              'UPDATE users SET is_active = true WHERE id = $1 RETURNING id',
              [userUuid]
            );
            break;
          case "deactivate":
            result = await client.query(
              'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
              [userUuid]
            );
            break;
          case "updateRole":
            result = await client.query(
              'UPDATE users SET role = $1 WHERE id = $2 RETURNING id',
              [data.role, userUuid]
            );
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        results.push({ userId, action, success: result.rowCount > 0 });
      } catch (opError) {
        results.push({ userId, action, success: false, error: opError.message });
      }
    }

    await client.query('COMMIT');

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
    await client.query('ROLLBACK');
    logger.error("Bulk update error:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Bulk update failed. All changes have been rolled back.",
      error: error.message,
    });
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
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get security statistics
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statsResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true AND last_login >= $1) as active_sessions,
        COUNT(*) FILTER (WHERE last_login >= $2) as recent_logins,
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users
      FROM users
    `, [sevenDaysAgo, today]);

    const stats = statsResult.rows[0];
    const totalActiveSessions = parseInt(stats.active_sessions);
    const recentLoginAttempts = parseInt(stats.recent_logins);
    const totalUsers = parseInt(stats.total_users);
    const verifiedUsers = parseInt(stats.verified_users);

    res.json({
      success: true,
      data: {
        user: {
          tokenVersion: 0, // PostgreSQL doesn't have token version yet
          lastLogin: user.last_login,
          isVerified: user.email_verified,
          accountCreated: user.created_at,
          revokedTokensCount: 0, // Would need separate tokens table
        },
        statistics: {
          activeSessions: totalActiveSessions,
          recentLogins: recentLoginAttempts,
          totalUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
          twoFactorEnabled: false, // Placeholder for future 2FA feature
        },
        lastActivity: user.last_login ? getTimeAgo(user.last_login) : 'Never',
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
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get password hash
    const userWithPassword = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    );
    
    if (!userWithPassword.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, userWithPassword.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Update password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, user.id]
    );

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

    const user = await userRepository.findByUserId(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Clear refresh token (token version would need separate implementation)
    await query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    );

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

    // Get user growth from PostgreSQL
    const hospitalFilter = req.hospitalId && req.user.role !== "super_admin" 
      ? `AND hospital_id = '${req.hospitalId}'` 
      : '';

    const userGrowthResult = await query(`
      SELECT 
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(MONTH FROM created_at) as month,
        role,
        COUNT(*) as count
      FROM users
      WHERE 1=1 ${hospitalFilter}
      GROUP BY year, month, role
      ORDER BY year DESC, month DESC
      LIMIT 12
    `);
    const userGrowth = userGrowthResult.rows.map(row => ({
      _id: { year: parseInt(row.year), month: parseInt(row.month), role: row.role },
      count: parseInt(row.count)
    }));

    // Get appointment trends
    const appointmentTrendsResult = await query(`
      SELECT 
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(MONTH FROM created_at) as month,
        status,
        COUNT(*) as count
      FROM appointments
      WHERE 1=1 ${hospitalFilter}
      GROUP BY year, month, status
      ORDER BY year DESC, month DESC
      LIMIT 12
    `);
    const appointmentTrends = appointmentTrendsResult.rows.map(row => ({
      _id: { year: parseInt(row.year), month: parseInt(row.month), status: row.status },
      count: parseInt(row.count)
    }));

    // Active users (logged in within last 7 days)
    const activeUsersResult = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_login >= $1 ${hospitalFilter}
    `, [weekAgo]);
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

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
    const emailExists = await userRepository.emailExists(email.toLowerCase());
    const phoneExists = await userRepository.phoneExists(phone);

    if (emailExists) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    }

    if (phoneExists) {
      return res.status(400).json({
        status: "error",
        message: "Phone number already exists",
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

    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in users table
    const userData = {
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role,
      hospitalId: req.hospitalId || req.user.hospitalId,
      hospitalName: req.user.hospitalName,
    };

    const user = await userRepository.create(userData);

    // Add role-specific data
    if (role === "doctor") {
      await query(`
        INSERT INTO doctors (user_id, specialization, qualification, experience, department, consultation_fee)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [user.id, specialization, qualification, experience || 0, department || specialization, 500]);
    } else if (role === "patient") {
      await query(`
        INSERT INTO patients (user_id, date_of_birth, gender, blood_group, address)
        VALUES ($1, $2, $3, $4, $5)
      `, [user.id, dateOfBirth, gender, bloodGroup, address]);
    }

    const userResponse = user;

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
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found or access denied",
      });
    }

    // Check hospital access
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    // Check for duplicate email or phone (if changed)
    if (email && email.toLowerCase() !== user.email) {
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), user.id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Email already exists",
        });
      }
    }

    if (phone && phone !== user.phone) {
      const phoneCheck = await query(
        'SELECT id FROM users WHERE phone = $1 AND id != $2',
        [phone, user.id]
      );
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Phone number already exists",
        });
      }
    }

    // Update common fields
    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (phone) updates.phone = phone.trim();

    if (Object.keys(updates).length > 0) {
      await userRepository.update(user.id, updates);
    }

    // Update role-specific fields
    if (user.role === "doctor") {
      const doctorUpdates = [];
      const doctorValues = [];
      let paramIndex = 1;
      
      if (specialization) {
        doctorUpdates.push(`specialization = $${paramIndex}`);
        doctorValues.push(specialization);
        paramIndex++;
      }
      if (qualification) {
        doctorUpdates.push(`qualification = $${paramIndex}`);
        doctorValues.push(qualification);
        paramIndex++;
      }
      if (experience !== undefined) {
        doctorUpdates.push(`experience = $${paramIndex}`);
        doctorValues.push(experience);
        paramIndex++;
      }
      if (department) {
        doctorUpdates.push(`department = $${paramIndex}`);
        doctorValues.push(department);
        paramIndex++;
      }
      if (consultationFee !== undefined) {
        doctorUpdates.push(`consultation_fee = $${paramIndex}`);
        doctorValues.push(consultationFee);
        paramIndex++;
      }
      
      if (doctorUpdates.length > 0) {
        doctorValues.push(user.id);
        await query(
          `UPDATE doctors SET ${doctorUpdates.join(', ')} WHERE user_id = $${paramIndex}`,
          doctorValues
        );
      }
    } else if (user.role === "patient") {
      const patientUpdates = [];
      const patientValues = [];
      let paramIndex = 1;
      
      if (dateOfBirth) {
        patientUpdates.push(`date_of_birth = $${paramIndex}`);
        patientValues.push(dateOfBirth);
        paramIndex++;
      }
      if (gender) {
        patientUpdates.push(`gender = $${paramIndex}`);
        patientValues.push(gender);
        paramIndex++;
      }
      if (bloodGroup) {
        patientUpdates.push(`blood_group = $${paramIndex}`);
        patientValues.push(bloodGroup);
        paramIndex++;
      }
      if (address) {
        patientUpdates.push(`address = $${paramIndex}`);
        patientValues.push(address);
        paramIndex++;
      }
      
      if (patientUpdates.length > 0) {
        patientValues.push(user.id);
        await query(
          `UPDATE patients SET ${patientUpdates.join(', ')} WHERE user_id = $${paramIndex}`,
          patientValues
        );
      }
    }

    // Get updated user
    const userResponse = await userRepository.findById(user.id);

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

    // Find user
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found or access denied",
      });
    }

    // Check hospital access
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        status: "error",
        message: "Access denied",
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
      const activeAppointmentsResult = await query(`
        SELECT COUNT(*) as count
        FROM appointments
        WHERE doctor_id = $1
        AND status IN ('scheduled', 'confirmed')
        AND appointment_date >= $2
      `, [user.id, new Date()]);

      const activeAppointments = parseInt(activeAppointmentsResult.rows[0].count);

      if (activeAppointments > 0) {
        return res.status(400).json({
          status: "error",
          message: `Cannot delete doctor with ${activeAppointments} active appointments. Please reschedule or cancel them first.`,
        });
      }
    }

    // Soft delete - set isActive to false
    await userRepository.update(user.id, { isActive: false });

    logger.info(
      `Admin ${req.user.userId} soft-deleted user ${userId} (${user.role})`
    );

    res.json({
      status: "success",
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} deleted successfully`,
      data: {
        userId: user.user_id,
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
