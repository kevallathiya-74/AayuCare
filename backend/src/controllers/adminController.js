/**
 * Admin Controller
 * Handles admin dashboard stats, user management, and system operations
 */

const mongoose = require("mongoose");
const userRepository = require("../repositories/userRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const doctorRepository = require("../repositories/doctorRepository");
const patientRepository = require("../repositories/patientRepository");
const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");
const logger = require("../utils/logger");
const { query } = require("../config/postgres");
const { withTransaction } = require("../utils/transaction");

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

    // Build SQL filters with parameterized queries (SQL injection prevention)
    const hasHospitalFilter = req.hospitalId && req.user.role !== "super_admin";

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
        WHERE 1=1 ${hasHospitalFilter ? 'AND hospital_id = $3' : ''}
      `, hasHospitalFilter ? [today, tomorrow, req.hospitalId] : [today, tomorrow]),
      // Doctor stats
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active
        FROM users
        WHERE role = 'doctor' ${hasHospitalFilter ? 'AND hospital_id = $1' : ''}
      `, hasHospitalFilter ? [req.hospitalId] : []),
      // Patient stats
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= $1) as new_this_month
        FROM users
        WHERE role = 'patient' ${hasHospitalFilter ? 'AND hospital_id = $2' : ''}
      `, hasHospitalFilter ? [new Date(new Date().setDate(1)), req.hospitalId] : [new Date(new Date().setDate(1))]),
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
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Enforce max 100

    // Build base query with hospitalId filter (skip for super_admin)
    const baseQuery = {};
    if (req.hospitalId && req.user.role !== "super_admin") {
      baseQuery.hospitalId = req.hospitalId;
    }

    // Get recent appointments from PostgreSQL
    const hospitalFilter2 = req.hospitalId && req.user.role !== "super_admin" 
      ? 'AND a.hospital_id = $2' 
      : '';
    const hospitalParams2 = req.hospitalId && req.user.role !== "super_admin" ? [limit, req.hospitalId] : [limit];
    
    const appointmentsResult = await query(`
      SELECT a.id, a.created_at,
             p.name as patient_name, p.user_id as patient_user_id,
             d.name as doctor_name, d.user_id as doctor_user_id
      FROM appointments a
      LEFT JOIN users p ON a.patient_id = p.id
      LEFT JOIN users d ON a.doctor_id = d.id
      WHERE 1=1 ${hospitalFilter2}
      ORDER BY a.created_at DESC
      LIMIT $1
    `, hospitalParams2);
    
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

    const mongoQuery = {};

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      mongoQuery.hospitalId = req.hospitalId;
    }
    
    // Debug logging
    logger.debug('getUsers query', {
      mongoQuery: JSON.stringify(mongoQuery),
      hospitalId: req.hospitalId,
      userRole: req.user?.role
    });

    if (role) {
      mongoQuery.role = role;
    }

    if (search) {
      // Validate search query length to prevent ReDoS
      if (search.length > 100) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Search query too long (max 100 characters)' 
        });
      }
      // Sanitize regex to prevent injection
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      mongoQuery.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { email: { $regex: sanitizedSearch, $options: "i" } },
        { userId: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    // Build PostgreSQL query
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Always filter out inactive users (soft deleted)
    conditions.push(`is_active = true`);

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

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [usersResult, countResult] = await Promise.all([
      query(`
        SELECT u.id, u.user_id, u.name, u.email, u.phone, u.role, u.hospital_id, u.hospital_name,
               u.is_active, u.email_verified, u.phone_verified, u.created_at, u.updated_at,
               d.specialization, d.qualification, d.experience, d.department, d.consultation_fee, d.bio,
               p.date_of_birth, p.gender, p.blood_group, p.address, 
               p.emergency_contact_name, p.emergency_contact_phone
        FROM users u
        LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
        LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, parseInt(limit), skip]),
      query(`SELECT COUNT(*) FROM users ${whereClause}`, params)
    ]);

    const users = usersResult.rows;
    const total = parseInt(countResult.rows[0].count);
    
    // Debug logging
    logger.debug('getUsers results', {
      foundCount: users.length,
      totalCount: total
    });

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

    logger.info("[STATUS_UPDATE] Request received", {
      userId,
      requestedStatus: isActive,
      adminId: req.user?.userId
    });

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    // Find user by userId (not UUID id)
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      logger.error("[STATUS_UPDATE] User not found", { userId });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info("[STATUS_UPDATE] User found", {
      userId: user.user_id,
      currentStatus: user.is_active,
      newStatus: isActive
    });

    // Update status
    const updatedUser = await userRepository.update(user.id, { isActive });

    logger.info("[STATUS_UPDATE] Database updated successfully", {
      userId: updatedUser.userId,
      newStatus: updatedUser.isActive,
      adminId: req.user.userId
    });

    // Invalidate relevant caches after status update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:*patients*"); // Invalidate all patient-related caches
      await deleteCacheByPattern("v1:cache:/api/admin/users*"); // Invalidate admin user list cache
      await deleteCacheByPattern("v1:cache:dashboard:*"); // Invalidate dashboard stats cache
      logger.debug("Cache invalidated after status update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    logger.error("[STATUS_UPDATE] Error:", {
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

    // Invalidate relevant caches after role update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      logger.debug("Cache invalidated after role update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

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

    // Invalidate relevant caches after bulk user update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      logger.debug("Cache invalidated after bulk user update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

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

    // Invalidate relevant caches after password change
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:session:*");
      await deleteCacheByPattern("cache:session:*");
      logger.debug("Cache invalidated after password change");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

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

    // Invalidate relevant caches after logout all devices
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:session:*");
      await deleteCacheByPattern("cache:session:*");
      logger.debug("Cache invalidated after logout all devices");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

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
    const hasHospitalFilter3 = req.hospitalId && req.user.role !== "super_admin";

    const userGrowthResult = await query(`
      SELECT 
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(MONTH FROM created_at) as month,
        role,
        COUNT(*) as count
      FROM users
      WHERE 1=1 ${hasHospitalFilter3 ? 'AND hospital_id = $1' : ''}
      GROUP BY year, month, role
      ORDER BY year DESC, month DESC
      LIMIT 12
    `, hasHospitalFilter3 ? [req.hospitalId] : []);
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
      WHERE 1=1 ${hasHospitalFilter3 ? 'AND hospital_id = $1' : ''}
      GROUP BY year, month, status
      ORDER BY year DESC, month DESC
      LIMIT 12
    `, hasHospitalFilter3 ? [req.hospitalId] : []);
    const appointmentTrends = appointmentTrendsResult.rows.map(row => ({
      _id: { year: parseInt(row.year), month: parseInt(row.month), status: row.status },
      count: parseInt(row.count)
    }));

    // Active users (logged in within last 7 days)
    const activeUsersResult = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_login >= $1 ${hasHospitalFilter3 ? 'AND hospital_id = $2' : ''}
    `, hasHospitalFilter3 ? [weekAgo, req.hospitalId] : [weekAgo]);
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

    // Log incoming request to diagnose address field issues
    logger.info("Patient creation request received:", {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      hasAddress: !!address,
      addressLength: address ? address.length : 0
    });

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

    // Generate auto-increment userId (PAT1, DOC1, ADM1 format)
    const userId = await userRepository.getNextUserId(role, req.hospitalId || req.user.hospitalId);

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
      // Build patient insert dynamically (only include provided fields)
      const patientFields = ['user_id'];
      const patientValues = [user.id];
      let paramIndex = 2;

      // Always include required fields
      if (dateOfBirth) {
        patientFields.push('date_of_birth');
        patientValues.push(dateOfBirth);
        paramIndex++;
      }
      if (gender) {
        patientFields.push('gender');
        patientValues.push(gender);
        paramIndex++;
      }
      
      // Optional fields - only insert if provided
      if (bloodGroup) {
        patientFields.push('blood_group');
        patientValues.push(bloodGroup);
        paramIndex++;
      }
      if (address) {
        patientFields.push('address');
        patientValues.push(address);
        paramIndex++;
      }

      // Build INSERT query dynamically
      const placeholders = patientValues.map((_, idx) => `$${idx + 1}`).join(', ');
      const insertQuery = `
        INSERT INTO patients (${patientFields.join(', ')})
        VALUES (${placeholders})
      `;
      
      logger.debug("Creating patient profile:", { 
        query: insertQuery, 
        values: patientValues,
        hasAddress: !!address 
      });
      
      await query(insertQuery, patientValues);
      logger.debug("Patient profile created successfully");
    }

    // Get complete user profile with role-specific data
    let userResponse = user;
    
    if (role === "doctor") {
      const doctorProfile = await doctorRepository.findByUserId(user.id);
      if (doctorProfile) {
        userResponse = { ...userResponse, ...doctorProfile };
      }
    } else if (role === "patient") {
      const patientProfile = await patientRepository.findByUserId(user.id);
      if (patientProfile) {
        userResponse = { ...userResponse, ...patientProfile };
      }
    }

    logger.info(`Admin ${req.user.userId} created new ${role}: ${userId}`);

    // Invalidate relevant caches after user creation
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:*patients*"); // Invalidate all patient-related caches including search
      await deleteCacheByPattern("v1:cache:/api/admin/users*"); // Invalidate admin user list cache
      await deleteCacheByPattern("v1:cache:dashboard:*"); // Invalidate dashboard stats cache
      logger.debug("Cache invalidated after user creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(201).json({
      status: "success",
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
      data: { user: userResponse },
    });
  } catch (error) {
    logger.error("Create user error:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
    });

    // Handle PostgreSQL unique constraint violations
    if (error.code === '23505') {
      // Unique constraint violation
      if (error.message.includes('phone')) {
        return res.status(400).json({
          status: "error",
          message: "Phone number already exists",
        });
      } else if (error.message.includes('email')) {
        return res.status(400).json({
          status: "error",
          message: "Email already exists",
        });
      }
    }

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

    logger.info('Update user profile request:', { 
      userId, 
      requestedFields: Object.keys(req.body),
      values: { name, email, phone, specialization, qualification, experience, department, consultationFee, dateOfBirth, gender, bloodGroup, address }
    });

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
      // First check if doctor record exists
      const doctorCheck = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [user.id]
      );
      
      if (doctorCheck.rows.length === 0) {
        logger.error('Doctor record not found for user', { userId: user.id, customUserId: userId });
        return res.status(404).json({
          status: "error",
          message: "Doctor profile not found. Please contact support.",
        });
      }
      
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
        const updateQuery = `UPDATE doctors SET ${doctorUpdates.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`;
        logger.info('Updating doctor:', { query: updateQuery, values: doctorValues, userId: user.id });
        const result = await query(updateQuery, doctorValues);
        logger.info('Doctor update result:', { rowCount: result.rowCount });
        
        if (result.rowCount === 0) {
          logger.error('Doctor update failed - no rows affected', { userId: user.id });
          return res.status(500).json({
            status: "error",
            message: "Failed to update doctor profile",
          });
        }
      }
    } else if (user.role === "patient") {
      // First check if patient record exists
      const patientCheck = await query(
        'SELECT id FROM patients WHERE user_id = $1',
        [user.id]
      );
      
      if (patientCheck.rows.length === 0) {
        logger.error('Patient record not found for user', { userId: user.id, customUserId: userId });
        return res.status(404).json({
          status: "error",
          message: "Patient profile not found. Please contact support.",
        });
      }
      
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
        const updateQuery = `UPDATE patients SET ${patientUpdates.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`;
        logger.info('Updating patient:', { query: updateQuery, values: patientValues, userId: user.id });
        const result = await query(updateQuery, patientValues);
        logger.info('Patient update result:', { rowCount: result.rowCount });
        
        if (result.rowCount === 0) {
          logger.error('Patient update failed - no rows affected', { userId: user.id });
          return res.status(500).json({
            status: "error",
            message: "Failed to update patient profile",
          });
        }
      }
    }

    // Get updated user with complete profile (including doctor/patient specific fields)
    let userResponse = await userRepository.findById(user.id);
    
    // If role is doctor or patient, fetch complete profile with JOIN
    if (user.role === "doctor") {
      const doctorProfile = await doctorRepository.findByUserId(user.id);
      if (doctorProfile) {
        userResponse = { ...userResponse, ...doctorProfile };
      }
    } else if (user.role === "patient") {
      const patientProfile = await patientRepository.findByUserId(user.id);
      if (patientProfile) {
        userResponse = { ...userResponse, ...patientProfile };
      }
    }

    // Invalidate relevant caches after successful update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:*patients*");
      logger.debug("Cache invalidated after profile update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
      // Don't fail the request if cache invalidation fails
    }

    logger.info(`Admin ${req.user.userId} updated profile of ${userId}`);

    res.json({
      status: "success",
      message: "User Profile Updated Successfully",
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

    // Soft delete - set isActive to false in PostgreSQL
    await userRepository.update(user.id, { isActive: false });

    // Also update MongoDB User if exists (for consistency)
    try {
      const mongoUser = await User.findOne({ userId: user.user_id });
      if (mongoUser) {
        mongoUser.isActive = false;
        await mongoUser.save();
        logger.info(`MongoDB User ${user.user_id} also marked as inactive`);
      }
    } catch (mongoError) {
      // Log but don't fail the request if MongoDB update fails
      logger.warn(`Failed to update MongoDB User ${user.user_id}:`, {
        error: mongoError.message,
      });
    }

    logger.info(
      `Admin ${req.user.userId} soft-deleted user ${userId} (${user.role})`
    );

    // Invalidate relevant caches after user deletion
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:*patients*"); // Invalidate all patient-related caches
      await deleteCacheByPattern("v1:cache:/api/admin/users*"); // Invalidate admin user list cache
      await deleteCacheByPattern("v1:cache:dashboard:*"); // Invalidate dashboard stats cache
      logger.debug("Cache invalidated after user deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

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
exports.permanentDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check hospital access (multi-tenancy)
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        status: "error",
        message: "Access denied - user belongs to different hospital",
      });
    }

    // Prevent deleting admin users (security)
    if (["admin", "super_admin"].includes(user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Cannot permanently delete admin users",
      });
    }

    // Check for active appointments (doctors only)
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

    // AUDIT LOG - Record this critical action BEFORE deletion
    logger.warn("PERMANENT DELETE INITIATED", {
      deletedUserId: user.user_id,
      deletedUserRole: user.role,
      deletedUserEmail: user.email,
      deletedBy: req.user.userId,
      deletedByRole: req.user.role,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // ATOMIC TRANSACTION - All deletions succeed or all fail
    await withTransaction(async (client) => {
      // 1. Delete role-specific data first (respects foreign key constraints)
      if (user.role === "doctor") {
        await client.query(`DELETE FROM doctors WHERE user_id = $1`, [user.id]);
        logger.info(`Deleted doctor profile for ${user.user_id}`);
      } else if (user.role === "patient") {
        await client.query(`DELETE FROM patients WHERE user_id = $1`, [user.id]);
        logger.info(`Deleted patient profile for ${user.user_id}`);
      }

      // 2. Delete from users table (PostgreSQL)
      await client.query(`DELETE FROM users WHERE id = $1`, [user.id]);
      logger.info(`Deleted user record from PostgreSQL: ${user.user_id}`);
    });

    // 3. Delete from MongoDB User collection (outside transaction as it's different DB)
    try {
      const mongoUser = await User.findOneAndDelete({ userId: user.user_id });
      if (mongoUser) {
        logger.info(`Deleted MongoDB User document: ${user.user_id}`);
      } else {
        logger.warn(`MongoDB User not found: ${user.user_id}`);
      }
    } catch (mongoError) {
      logger.error(`Failed to delete MongoDB User ${user.user_id}:`, {
        error: mongoError.message,
        stack: mongoError.stack,
      });
      // Note: PostgreSQL deletion already committed, log this inconsistency
      logger.error("DATABASE INCONSISTENCY: PostgreSQL deleted but MongoDB failed", {
        userId: user.user_id,
        error: mongoError.message,
      });
    }

    // FINAL AUDIT LOG - Record successful completion
    logger.warn("PERMANENT DELETE COMPLETED", {
      deletedUserId: user.user_id,
      deletedUserRole: user.role,
      deletedBy: req.user.userId,
      timestamp: new Date().toISOString(),
      success: true,
    });

    // Invalidate relevant caches after permanent deletion
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:*patients*"); // Invalidate all patient-related caches
      await deleteCacheByPattern("v1:cache:/api/admin/users*"); // Invalidate admin user list cache
      logger.debug("Cache invalidated after permanent user deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      status: "success",
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} permanently deleted. This action cannot be undone.`,
      data: {
        userId: user.user_id,
        deletedAt: new Date(),
        deletedBy: req.user.userId,
      },
    });
  } catch (error) {
    logger.error("PERMANENT delete error:", {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId,
      requestedBy: req.user?.userId,
    });
    res.status(500).json({
      status: "error",
      message: "Failed to permanently delete user",
      error: error.message,
    });
  }
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