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
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

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
      totalPrescriptions,
      prescriptionsToday,
      prescriptionsYesterday,
      revenueStats,
    ] = await Promise.all([
      // Appointment stats
      query(`
        SELECT 
          COUNT(*) FILTER (WHERE 1=1) as total,
          COUNT(*) FILTER (WHERE appointment_date >= $1 AND appointment_date < $2) as today,
          COUNT(*) FILTER (WHERE appointment_date >= $3 AND appointment_date < $1) as yesterday,
          COUNT(*) FILTER (WHERE status IN ('scheduled', 'confirmed')) as pending,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE appointment_date >= $4) as this_month,
          COUNT(*) FILTER (WHERE appointment_date >= $5 AND appointment_date < $4) as previous_month
        FROM appointments
        WHERE 1=1 ${hasHospitalFilter ? 'AND hospital_id = $6' : ''}
      `, hasHospitalFilter ? [today, tomorrow, yesterday, currentMonthStart, previousMonthStart, req.hospitalId] : [today, tomorrow, yesterday, currentMonthStart, previousMonthStart]),
      // Doctor stats
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE created_at >= $1) as new_this_month,
          COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $1) as new_previous_month
        FROM users
        WHERE role = 'doctor' ${hasHospitalFilter ? 'AND hospital_id = $3' : ''}
      `, hasHospitalFilter ? [currentMonthStart, previousMonthStart, req.hospitalId] : [currentMonthStart, previousMonthStart]),
      // Patient stats
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= $1) as new_this_month,
          COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $1) as new_previous_month
        FROM users
        WHERE role = 'patient' ${hasHospitalFilter ? 'AND hospital_id = $3' : ''}
      `, hasHospitalFilter ? [currentMonthStart, previousMonthStart, req.hospitalId] : [currentMonthStart, previousMonthStart]),
      // Prescription stats
      prescriptionRepository.count(baseQuery),
      prescriptionRepository.count({
        ...baseQuery,
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      prescriptionRepository.count({
        ...baseQuery,
        createdAt: { $gte: yesterday, $lt: today },
      }),
      query(`
        SELECT 
          COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total,
          COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= $1 AND p.created_at < $2 THEN p.amount ELSE 0 END), 0) as today,
          COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= $3 AND p.created_at < $1 THEN p.amount ELSE 0 END), 0) as yesterday
        FROM payments p
        LEFT JOIN appointments a ON p.appointment_id = a.id
        WHERE 1=1 ${hasHospitalFilter ? 'AND a.hospital_id = $4' : ''}
      `, hasHospitalFilter ? [today, tomorrow, yesterday, req.hospitalId] : [today, tomorrow, yesterday]),
    ]);

    const calculateTrend = (currentValue, previousValue) => {
      if (!previousValue) {
        return currentValue > 0 ? 100 : 0;
      }
      return Math.round(((currentValue - previousValue) / previousValue) * 100);
    };

    const totalAppointments = parseInt(appointmentStats.rows[0].total);
    const appointmentsToday = parseInt(appointmentStats.rows[0].today);
    const pendingAppointments = parseInt(appointmentStats.rows[0].pending);
    const completedAppointments = parseInt(appointmentStats.rows[0].completed);
    const totalDoctors = parseInt(doctorStats.rows[0].total);
    const activeDoctors = parseInt(doctorStats.rows[0].active);
    const totalPatients = parseInt(patientStats.rows[0].total);
    const newPatientsThisMonth = parseInt(patientStats.rows[0].new_this_month);
    const totalPrescriptionsCount = parseInt(totalPrescriptions, 10);
    const prescriptionsTodayCount = parseInt(prescriptionsToday, 10);
    const prescriptionsYesterdayCount = parseInt(prescriptionsYesterday, 10);
    const appointmentsThisMonth = parseInt(appointmentStats.rows[0].this_month, 10);
    const appointmentsPreviousMonth = parseInt(appointmentStats.rows[0].previous_month, 10);
    const doctorsNewThisMonth = parseInt(doctorStats.rows[0].new_this_month, 10);
    const doctorsNewPreviousMonth = parseInt(
      doctorStats.rows[0].new_previous_month,
      10
    );
    const patientsNewPreviousMonth = parseInt(
      patientStats.rows[0].new_previous_month,
      10
    );

    const totalRevenue = parseFloat(revenueStats.rows[0].total || 0);
    const revenueToday = parseFloat(revenueStats.rows[0].today || 0);
    const revenueYesterday = parseFloat(revenueStats.rows[0].yesterday || 0);

    res.json({
      success: true,
      data: {
        appointments: {
          total: totalAppointments,
          today: appointmentsToday,
          pending: pendingAppointments,
          completed: completedAppointments,
          trend: calculateTrend(appointmentsThisMonth, appointmentsPreviousMonth),
        },
        doctors: {
          total: totalDoctors,
          active: activeDoctors,
          onDuty: activeDoctors,
          trend: calculateTrend(doctorsNewThisMonth, doctorsNewPreviousMonth),
        },
        patients: {
          total: totalPatients,
          new: newPatientsThisMonth,
          returning: totalPatients - newPatientsThisMonth,
          trend: calculateTrend(newPatientsThisMonth, patientsNewPreviousMonth),
        },
        prescriptions: {
          total: totalPrescriptionsCount,
          today: prescriptionsTodayCount,
          trend: calculateTrend(prescriptionsTodayCount, prescriptionsYesterdayCount),
        },
        revenue: {
          total: totalRevenue,
          today: revenueToday,
          trend: calculateTrend(revenueToday, revenueYesterday),
        },
      },
    });
  } catch (error) {
    logger.error("Dashboard stats error:", {
      error: error.message,
      stack: error.stack,
    });
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
    // Prevent HTTP Parameter Pollution (HPP) type confusion — coerce all scalar params to strings
    const ALLOWED_ROLES = ['admin', 'doctor', 'patient', 'super_admin'];
    const rawRole = Array.isArray(req.query.role) ? req.query.role[0] : req.query.role;
    const role = rawRole && ALLOWED_ROLES.includes(String(rawRole)) ? String(rawRole) : undefined;
    const rawPage  = Array.isArray(req.query.page)  ? req.query.page[0]  : req.query.page;
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const search   = Array.isArray(req.query.search) ? String(req.query.search[0]) : req.query.search;
    const page  = rawPage  ? parseInt(String(rawPage),  10) || 1  : 1;
    const limit = rawLimit ? parseInt(String(rawLimit), 10) || 20 : 20;
    const skip = (page - 1) * limit;

    // Validate search query length to prevent ReDoS
    if (search && search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query too long (max 100 characters)",
      });
    }

    // Build PostgreSQL query
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // By default exclude inactive users; pass includeInactive=true to show all
    if (req.query.includeInactive !== 'true') {
      conditions.push(`is_active = true`);
    }

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
               p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relation
        FROM users u
        LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
        LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, parseInt(limit), skip]),
      query(`SELECT COUNT(*) FROM users ${whereClause}`, params)
    ]);

    // Map snake_case PostgreSQL columns to camelCase for frontend consistency
    const users = usersResult.rows.map((row) => ({
      _id: row.id,
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      phoneVerified: row.phone_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Doctor-specific fields (null for patients)
      specialization: row.specialization,
      qualification: row.qualification,
      experience: row.experience,
      department: row.department,
      consultationFee: row.consultation_fee,
      bio: row.bio,
      // Patient-specific fields (null for doctors)
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      bloodGroup: row.blood_group,
      address: row.address,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      emergencyContactRelation: row.emergency_contact_relation,
    }));
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
    next(error);
  }
};

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PATCH /api/admin/users/:userId/status
 * @access  Private (Admin only)
 */
exports.updateUserStatus = async (req, res, next) => {
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

    // Hospital scope check â€” prevent cross-hospital modifications
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Access denied â€” user belongs to a different hospital",
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

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_STATUS_CHANGE,
      entityType: "user",
      entityId: user.id,
      oldValues: { isActive: user.is_active },
      newValues: { isActive },
      req,
    });

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
    next(error);
  }
};

/**
 * @desc    Update user role (with optimistic locking)
 * @route   PATCH /api/admin/users/:userId/role
 * @access  Private (Admin only)
 */
exports.updateUserRole = async (req, res, next) => {
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

    // Hospital scope check â€” prevent cross-hospital role changes
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Access denied â€” user belongs to a different hospital",
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
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after role update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.ROLE_CHANGE,
      entityType: "user",
      entityId: user.id,
      oldValues: { role: user.role },
      newValues: { role },
      req,
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
    next(error);
  }
};

/**
 * @desc    Bulk update users (transactional)
 * @route   POST /api/admin/users/bulk
 * @access  Private (Admin only)
 */
exports.bulkUpdateUsers = async (req, res, next) => {
  const client = await require("../config/postgres").getClient();
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
          'SELECT id, hospital_id FROM users WHERE user_id = $1',
          [userId]
        );

        if (userResult.rows.length === 0) {
          results.push({ userId, action, success: false, error: 'User not found' });
          continue;
        }

        const userRow = userResult.rows[0];

        // Hospital scope check â€” prevent cross-hospital bulk operations
        if (req.hospitalId && req.user.role !== "super_admin" && userRow.hospital_id !== req.hospitalId) {
          results.push({ userId, action, success: false, error: "Access denied â€” cross-hospital operation" });
          continue;
        }

        const userUuid = userRow.id;

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
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
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
    next(error);
  } finally {
    client.release();
  }
};

/**
 * @desc    Get system health
 * @route   GET /api/admin/system/health
 * @access  Private (Admin only)
 */
exports.getSystemHealth = async (req, res, next) => {
  try {
    const services = {
      mongodb: { connected: false },
      postgres: { connected: false },
      redis: { connected: false },
    };

    try {
      const mongoPing = await mongoose.connection.db.admin().ping();
      services.mongodb.connected = mongoPing?.ok === 1;
    } catch (mongoError) {
      logger.warn("MongoDB health check failed:", mongoError.message);
    }

    try {
      await query("SELECT 1");
      services.postgres.connected = true;
    } catch (postgresError) {
      logger.warn("PostgreSQL health check failed:", postgresError.message);
    }

    try {
      const redisPing = await redisClient.ping();
      services.redis.connected = redisPing === "PONG";
    } catch (redisError) {
      logger.warn("Redis health check failed:", redisError.message);
    }

    const issues = Object.values(services).filter((service) => !service.connected).length;
    const status = issues === 0 ? "good" : issues === 1 ? "warning" : "critical";
    const memory = process.memoryUsage();

    res.json({
      success: true,
      data: {
        status,
        issues,
        database: {
          connected: services.mongodb.connected,
        },
        services,
        memory,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    logger.error("System health check error:", { error: error.message });
    next(error);
  }
};

/**
 * @desc    Get security settings and statistics
 * @route   GET /api/admin/security
 * @access  Private (Admin only)
 */
exports.getSecuritySettings = async (req, res, next) => {
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

    const hasHospSec = req.hospitalId && req.user.role !== "super_admin";
    const statsResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true AND last_login >= $1) as active_users_7d,
        COUNT(*) FILTER (WHERE last_login >= $2) as recent_logins,
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users
      FROM users
      ${hasHospSec ? "WHERE hospital_id = $3" : ""}
    `, hasHospSec ? [sevenDaysAgo, today, req.hospitalId] : [sevenDaysAgo, today]);

    const sessionStatsResult = await query(
      `SELECT COUNT(*)::int AS active_sessions
       FROM session
       WHERE expires_at > NOW()`
    );

    const userSessionStatsResult = await query(
      `SELECT COUNT(*)::int AS active_sessions
       FROM session
       WHERE user_id = $1
         AND expires_at > NOW()`,
      [user.id]
    );

    const stats = statsResult.rows[0];
    const totalActiveSessions = parseInt(
      sessionStatsResult.rows[0]?.active_sessions || 0,
      10
    );
    const myActiveSessions = parseInt(
      userSessionStatsResult.rows[0]?.active_sessions || 0,
      10
    );
    const recentLoginAttempts = parseInt(stats.recent_logins);
    const totalUsers = parseInt(stats.total_users);
    const verifiedUsers = parseInt(stats.verified_users);

    res.json({
      success: true,
      data: {
        user: {
          lastLogin: user.last_login,
          isVerified: user.email_verified,
          accountCreated: user.created_at,
          lastPasswordChange: user.updated_at,
          myActiveSessions,
        },
        statistics: {
          activeSessions: totalActiveSessions,
          activeUsers7d: parseInt(stats.active_users_7d, 10),
          recentLogins: recentLoginAttempts,
          totalUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
        },
        lastActivity: user.last_login ? getTimeAgo(user.last_login) : 'Never',
      },
    });
  } catch (error) {
    logger.error('Security settings error:', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   POST /api/admin/security/change-password
 * @access  Private (Admin only)
 */
exports.changePassword = async (req, res, next) => {
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

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password',
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

    const deletedSessionsResult = await query(
      'DELETE FROM session WHERE user_id = $1',
      [user.id]
    );

    logger.info(`Password changed for user: ${userId}`);

    // Invalidate relevant caches after password change
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
      data: {
        loggedOutSessions: deletedSessionsResult.rowCount || 0,
      },
    });
  } catch (error) {
    logger.error('Change password error:', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Logout from all devices
 * @route   POST /api/admin/security/logout-all
 * @access  Private (Admin only)
 */
exports.logoutAllDevices = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await userRepository.findByUserId(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const deletedSessionsResult = await query(
      'DELETE FROM session WHERE user_id = $1',
      [user.id]
    );

    await query('UPDATE users SET updated_at = NOW() WHERE id = $1', [user.id]);

    logger.info(`Logged out all devices for user: ${userId}`);

    // Invalidate relevant caches after logout all devices
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
      data: {
        loggedOutSessions: deletedSessionsResult.rowCount || 0,
      },
    });
  } catch (error) {
    logger.error('Logout all devices error:', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get medical records overview (metadata only)
 * @route   GET /api/admin/medical-records
 * @access  Private (Admin only)
 */
exports.getMedicalRecordsOverview = async (req, res, next) => {
  try {
    const rawPatientId = Array.isArray(req.query.patientId) ? req.query.patientId[0] : req.query.patientId;
    const rawPage  = Array.isArray(req.query.page)  ? req.query.page[0]  : req.query.page;
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const page  = rawPage  ? parseInt(String(rawPage),  10) || 1  : 1;
    const limit = rawLimit ? parseInt(String(rawLimit), 10) || 20 : 20;
    const skip = (page - 1) * limit;

    // Validate patientId UUID format before using in MongoDB filter
    const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const patientId = rawPatientId && UUID_RE.test(String(rawPatientId)) ? String(rawPatientId) : undefined;
    if (rawPatientId && !patientId) {
      return next(new AppError('Invalid patient ID format', 400));
    }

    const mongoFilter = {};

    // Add hospitalId filter for multi-tenancy
    if (req.hospitalId && req.user.role !== "super_admin") {
      mongoFilter.hospitalId = req.hospitalId;
    }

    if (patientId) {
      mongoFilter.patientId = patientId;
    }

    const [records, total] = await Promise.all([
      medicalRecordRepository.findWithFilters(mongoFilter, {
        select: "recordType title patientId doctorId createdAt updatedAt hospitalId",
        populate: {
          patientId: "name userId",
          doctorId: "name specialization"
        },
        sort: { createdAt: -1 },
        offset: skip,
        limit: parseInt(limit),
        lean: true
      }),
      medicalRecordRepository.count(mongoFilter),
    ]);

    // Aggregate by record type - using repository aggregation method
    const typeStats = await medicalRecordRepository.aggregate([
      { $match: mongoFilter },
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
    next(error);
  }
};

/**
 * @desc    Get system metrics and aggregations
 * @route   GET /api/admin/system/metrics
 * @access  Private (Admin only)
 */
exports.getSystemMetrics = async (req, res, next) => {
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

    // Total users count
    const totalUsersResult = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE 1=1 ${hasHospitalFilter3 ? 'AND hospital_id = $1' : ''}
    `, hasHospitalFilter3 ? [req.hospitalId] : []);
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Database size stats
    const dbStats = await mongoose.connection.db.stats();

    res.json({
      success: true,
      data: {
        userGrowth,
        appointmentTrends,
        activeUsers,
        totalUsers,
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
    next(error);
  }
};

/**
 * @desc    Get notifications for management
 * @route   GET /api/admin/notifications/manage
 * @access  Private (Admin only)
 */
exports.getNotificationsManagement = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const mongoFilter = {};

    // Add hospitalId filter for multi-tenancy
    if (req.hospitalId && req.user.role !== "super_admin") {
      mongoFilter.hospitalId = req.hospitalId;
    }

    if (type) {
      mongoFilter.type = type;
    }

    if (status) {
      mongoFilter.read = status === "read";
    }

    const [notifications, total, unreadCount] = await Promise.all([
      notificationRepository.findWithFilters(mongoFilter, { limit: parseInt(limit), offset: skip }),
      notificationRepository.count(mongoFilter),
      notificationRepository.count({ ...mongoFilter, read: false }),
    ]);

    // Type distribution
    const typeStats = await notificationRepository.aggregate([
      { $match: mongoFilter },
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
    next(error);
  }
};

/**
 * @desc    Create new user (doctor or patient)
 * @route   POST /api/admin/users
 * @access  Private (Admin only)
 */
exports.createUser = async (req, res, next) => {
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
      consultationFee,
      licenseNumber,
      license_number,
      bio,
      availability,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      allergies,
      chronicConditions,
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
      emergencyContactName,
      emergencyContactPhone,
      allergies,
      chronicConditions,
      hasAddress: !!address,
      addressLength: address ? address.length : 0
    });

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, password, and role are required",
      });
    }

    // Validate role
    if (!["doctor", "patient"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either doctor or patient",
      });
    }

    // Role-specific validation
    if (role === "doctor") {
      if (!specialization || !qualification) {
        return res.status(400).json({
          success: false,
          message: "Specialization and qualification are required for doctors",
        });
      }
    }

    // Check for duplicate email or phone
    const emailExists = await userRepository.emailExists(email.toLowerCase());
    const phoneExists = await userRepository.phoneExists(phone);

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    // Generate auto-increment userId (PAT1, DOC1, ADM1 format)
    const userId = await userRepository.getNextUserId(role);

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
      const normalizedAvailability =
        typeof availability === "string"
          ? (() => {
              try {
                return JSON.parse(availability);
              } catch {
                return {};
              }
            })()
          : availability || {};
      const normalizedLicenseNumber = licenseNumber || license_number || null;

      await query(`
        INSERT INTO doctors (user_id, specialization, qualification, experience, department, consultation_fee, license_number, bio, availability)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        user.id,
        specialization,
        qualification,
        experience || 0,
        department || specialization,
        consultationFee ?? 500,
        normalizedLicenseNumber,
        bio || null,
        JSON.stringify(normalizedAvailability),
      ]);
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
      if (emergencyContactName) {
        patientFields.push('emergency_contact_name');
        patientValues.push(emergencyContactName);
        paramIndex++;
      }
      if (emergencyContactPhone) {
        patientFields.push('emergency_contact_phone');
        patientValues.push(emergencyContactPhone);
        paramIndex++;
      }
      if (emergencyContactRelation) {
        patientFields.push('emergency_contact_relation');
        patientValues.push(emergencyContactRelation);
        paramIndex++;
      }
      if (Array.isArray(allergies) && allergies.length > 0) {
        patientFields.push('allergies');
        patientValues.push(allergies);
        paramIndex++;
      }
      if (Array.isArray(chronicConditions) && chronicConditions.length > 0) {
        patientFields.push('chronic_conditions');
        patientValues.push(chronicConditions);
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

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_REGISTER,
      entityType: "user",
      entityId: user.id,
      newValues: { userId: user.userId, role, email: user.email },
      req,
    });

    res.status(201).json({
      success: true,
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
          success: false,
          message: "Phone number already exists",
        });
      } else if (error.message.includes('email')) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    next(error);
  }
};

/**
 * @desc    Update user profile (full update)
 * @route   PUT /api/admin/users/:userId
 * @access  Private (Admin only)
 */
exports.updateUserProfile = async (req, res, next) => {
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
      licenseNumber,
      license_number,
      bio,
      availability,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      allergies,
      chronicConditions,
    } = req.body;

    logger.info('Update user profile request:', { 
      userId, 
      requestedFields: Object.keys(req.body),
      values: {
        name,
        email,
        phone,
        specialization,
        qualification,
        experience,
        department,
        consultationFee,
        licenseNumber,
        license_number,
        bio,
        availability,
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        emergencyContactName,
        emergencyContactPhone,
        allergies,
        chronicConditions,
      }
    });

    // Find user with hospitalId filter
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or access denied",
      });
    }

    // Check hospital access
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        success: false,
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
          success: false,
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
          success: false,
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
          success: false,
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
      const normalizedLicenseNumber = licenseNumber ?? license_number;
      if (normalizedLicenseNumber !== undefined) {
        doctorUpdates.push(`license_number = $${paramIndex}`);
        doctorValues.push(normalizedLicenseNumber || null);
        paramIndex++;
      }
      if (bio !== undefined) {
        doctorUpdates.push(`bio = $${paramIndex}`);
        doctorValues.push(bio || null);
        paramIndex++;
      }
      if (availability !== undefined) {
        doctorUpdates.push(`availability = $${paramIndex}`);
        doctorValues.push(JSON.stringify(availability || {}));
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
          return next(new AppError("Failed to update doctor profile. Please try again.", 500));
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
          success: false,
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
      if (emergencyContactName) {
        patientUpdates.push(`emergency_contact_name = $${paramIndex}`);
        patientValues.push(emergencyContactName);
        paramIndex++;
      }
      if (emergencyContactPhone) {
        patientUpdates.push(`emergency_contact_phone = $${paramIndex}`);
        patientValues.push(emergencyContactPhone);
        paramIndex++;
      }
      if (emergencyContactRelation) {
        patientUpdates.push(`emergency_contact_relation = $${paramIndex}`);
        patientValues.push(emergencyContactRelation);
        paramIndex++;
      }
      if (Array.isArray(allergies)) {
        patientUpdates.push(`allergies = $${paramIndex}`);
        patientValues.push(allergies);
        paramIndex++;
      }
      if (Array.isArray(chronicConditions)) {
        patientUpdates.push(`chronic_conditions = $${paramIndex}`);
        patientValues.push(chronicConditions);
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
          return next(new AppError("Failed to update patient profile. Please try again.", 500));
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
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:*patients*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after profile update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
      // Don't fail the request if cache invalidation fails
    }

    logger.info(`Admin ${req.user.userId} updated profile of ${userId}`);

    res.json({
      success: true,
      message: "User Profile Updated Successfully",
      data: { user: userResponse },
    });
  } catch (error) {
    logger.error("Update user profile error:", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/admin/users/:userId
 * @access  Private (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or access denied",
      });
    }

    // Check hospital access
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Prevent deleting admin users
    if (["admin", "super_admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
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
          success: false,
          message: `Cannot delete doctor with ${activeAppointments} active appointments. Please reschedule or cancel them first.`,
        });
      }
    }

    // Soft delete - set isActive to false in PostgreSQL
    await userRepository.update(user.id, { isActive: false });

    logger.info(
      `Admin ${req.user.userId} soft-deleted user ${userId} (${user.role})`
    );

    // Invalidate relevant caches after user deletion
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
      success: true,
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
    next(error);
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
exports.permanentDeleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check hospital access (multi-tenancy)
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Access denied - user belongs to different hospital",
      });
    }

    // Prevent deleting admin users (security)
    if (["admin", "super_admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
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
          success: false,
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

    // MongoDB cleanup â€” remove orphaned documents for the deleted user
    try {
      const mongoCleanupTasks = [];
      if (user.role === "patient") {
        mongoCleanupTasks.push(
          prescriptionRepository.deleteMany({ patientId: user.user_id })
        );
        mongoCleanupTasks.push(
          medicalRecordRepository.deleteMany({ patientId: user.user_id })
        );
      }
      // Clean up notifications for all roles
      mongoCleanupTasks.push(notificationRepository.deleteAllForUser(user.user_id));
      const cleanupResults = await Promise.allSettled(mongoCleanupTasks);
      cleanupResults.forEach((result, i) => {
        if (result.status === "rejected") {
          logger.warn(`MongoDB cleanup task ${i} failed:`, result.reason?.message);
        }
      });
      logger.info("MongoDB cleanup completed for deleted user", { userId: user.user_id });
    } catch (mongoCleanupError) {
      logger.warn("MongoDB cleanup failed for deleted user:", {
        userId: user.user_id,
        error: mongoCleanupError.message,
      });
      // Don't fail the request â€” PostgreSQL deletion already succeeded
    }

    // FINAL AUDIT LOG - Record successful completion
    logger.warn("PERMANENT DELETE COMPLETED", {
      deletedUserId: user.user_id,
      deletedUserRole: user.role,
      deletedBy: req.user.userId,
      timestamp: new Date().toISOString(),
      success: true,
    });
    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_DELETE,
      entityType: "user",
      entityId: user.id,
      oldValues: { userId: user.user_id, role: user.role, email: user.email },
      req,
    });

    // Invalidate relevant caches after permanent deletion
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("v1:cache:*patients*"); // Invalidate all patient-related caches
      await deleteCacheByPattern("v1:cache:/api/admin/users*"); // Invalidate admin user list cache
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after permanent user deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
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
    next(error);
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

/**
 * @desc    Get audit logs with optional filtering and pagination
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin, super_admin)
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      action,
      userId,
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Build WHERE clauses dynamically
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (startDate) {
      conditions.push(`al.created_at >= $${paramIdx++}`);
      params.push(new Date(startDate));
    }
    if (endDate) {
      // Include the full end day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(`al.created_at <= $${paramIdx++}`);
      params.push(end);
    }
    if (action) {
      conditions.push(`al.action = $${paramIdx++}`);
      params.push(action);
    }
    if (userId) {
      conditions.push(`al.user_id = $${paramIdx++}::uuid`);
      params.push(userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch paginated audit logs with actor name
    const logsResult = await query(
      `SELECT
         al.id,
         al.action,
         al.entity_type,
         al.entity_id,
         al.old_values,
         al.new_values,
         al.ip_address,
         al.user_agent,
         al.successful,
         al.error_message,
         al.created_at,
         u.name         AS actor_name,
         u.user_id      AS actor_user_id,
         u.role         AS actor_role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, parseInt(limit, 10), offset]
    );

    res.json({
      success: true,
      data: logsResult.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error("getAuditLogs error:", { error: error.message, stack: error.stack });
    next(error);
  }
};

