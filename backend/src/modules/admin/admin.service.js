/**
 * Admin Service
 * All business logic for admin operations.
 * Calls adminRepository and other modular repositories — no direct DB access.
 */

const adminRepository = require("./admin.repository");
const prescriptionRepository = require("../prescription/prescription.repository");
const userRepository = require("../auth/user.repository");
const doctorRepository = require("../doctor/doctor.repository");
const patientRepository = require("../patient/patient.repository");
const medicalRecordRepository = require("../medical-record/medical-record.repository");
const notificationRepository = require("../notification/notification.repository");
const { AppError } = require("../../middleware/errorHandler");

const { writeAuditLog, AUDIT_ACTIONS } = require("../../utils/audit");
const logger = require("../../utils/logger");
const { invalidateByPatterns } = require("../../utils/cacheInvalidation");
const bcrypt = require("bcryptjs");

const CACHE_KEYS = {
  USER: "v1:cache:*user*",
  DOCTORS: "v1:cache:*doctors*",
  DOCTOR: "v1:cache:*doctor*",
  PATIENT: "v1:cache:*patient*",
  PATIENTS: "v1:cache:*patients*",
  DASHBOARD: "v1:cache:*dashboard*",
  SESSION: "v1:cache:*session*",
  ADMIN_USERS: "v1:cache:*admin/users*",
};

/**
 * @typedef {Object} ScopeContext
 * @property {string|null} hospitalId
 * @property {string} role
 */

/** @param {ScopeContext} ctx */
const getScopedHospitalId = (ctx = {}) =>
  ctx.hospitalId && ctx.role !== "super_admin" ? ctx.hospitalId : null;

const invalidateCaches = async (...patterns) => {
  await invalidateByPatterns(patterns);
};

const calculateTrend = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const getDashboardStats = async (ctx) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousMonthStart = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1,
  );

  const scopedHospitalId = getScopedHospitalId(ctx);
  const baseQuery = scopedHospitalId ? { hospitalId: scopedHospitalId } : {};

  const safePrescriptionCount = async (filters, source) => {
    try {
      return await prescriptionRepository.count(filters);
    } catch (error) {
      logger.warn(
        `Prescription count fallback triggered for ${source}:`,
        error.message,
      );
      return 0;
    }
  };

  const [
    appointmentStats,
    doctorStats,
    patientStats,
    totalPrescriptions,
    prescriptionsToday,
    prescriptionsYesterday,
    revenueStats,
  ] = await Promise.all([
    adminRepository.getAppointmentStats({
      today,
      tomorrow,
      yesterday,
      currentMonthStart,
      previousMonthStart,
      hospitalId: scopedHospitalId,
    }),
    adminRepository.getDoctorStats({
      currentMonthStart,
      previousMonthStart,
      hospitalId: scopedHospitalId,
    }),
    adminRepository.getPatientStats({
      currentMonthStart,
      previousMonthStart,
      hospitalId: scopedHospitalId,
    }),
    safePrescriptionCount(baseQuery, "prescriptions_total"),
    safePrescriptionCount(
      { ...baseQuery, startDate: today, endDate: tomorrow },
      "prescriptions_today",
    ),
    safePrescriptionCount(
      { ...baseQuery, startDate: yesterday, endDate: today },
      "prescriptions_yesterday",
    ),
    adminRepository.getRevenueStats({
      today,
      tomorrow,
      yesterday,
      hospitalId: scopedHospitalId,
    }),
  ]);

  const totalAppointments = parseInt(appointmentStats.total, 10);
  const appointmentsToday = parseInt(appointmentStats.today, 10);
  const pendingAppointments = parseInt(appointmentStats.pending, 10);
  const completedAppointments = parseInt(appointmentStats.completed, 10);
  const totalDoctors = parseInt(doctorStats.total, 10);
  const activeDoctors = parseInt(doctorStats.active, 10);
  const totalPatients = parseInt(patientStats.total, 10);
  const newPatientsThisMonth = parseInt(patientStats.new_this_month, 10);
  const totalPrescriptionsCount = parseInt(totalPrescriptions, 10);
  const prescriptionsTodayCount = parseInt(prescriptionsToday, 10);
  const prescriptionsYesterdayCount = parseInt(prescriptionsYesterday, 10);
  const appointmentsThisMonth = parseInt(appointmentStats.this_month, 10);
  const appointmentsPreviousMonth = parseInt(
    appointmentStats.previous_month,
    10,
  );
  const doctorsNewThisMonth = parseInt(doctorStats.new_this_month, 10);
  const doctorsNewPreviousMonth = parseInt(doctorStats.new_previous_month, 10);
  const patientsNewPreviousMonth = parseInt(
    patientStats.new_previous_month,
    10,
  );
  const totalRevenue = parseFloat(revenueStats.total || 0);
  const revenueToday = parseFloat(revenueStats.today || 0);
  const revenueYesterday = parseFloat(revenueStats.yesterday || 0);

  return {
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
      trend: calculateTrend(
        prescriptionsTodayCount,
        prescriptionsYesterdayCount,
      ),
    },
    revenue: {
      total: totalRevenue,
      today: revenueToday,
      trend: calculateTrend(revenueToday, revenueYesterday),
    },
    meta: {
      degraded: false,
      degradedSources: [],
    },
  };
};

const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getRecentActivities = async (limit, ctx) => {
  const scopedHospitalId = getScopedHospitalId(ctx);

  const [recentAppointmentRows, recentPrescriptions] = await Promise.all([
    adminRepository.getRecentAppointments({
      limit,
      hospitalId: scopedHospitalId,
    }),
    prescriptionRepository.findWithFilters(
      { hospitalId: scopedHospitalId },
      { limit, offset: 0 },
    ),
  ]);

  const recentAppointments = recentAppointmentRows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    patientId: { name: row.patient_name, userId: row.patient_user_id },
    doctorId: { name: row.doctor_name, userId: row.doctor_user_id },
  }));

  const activities = [
    ...recentAppointments.map((apt) => ({
      id: apt.id,
      text: `${apt.doctorId?.name || "Doctor"} scheduled appointment with ${apt.patientId?.name || "patient"}`,
      icon: "calendar",
      time: apt.createdAt,
      type: "appointment",
    })),
    ...recentPrescriptions.map((presc) => ({
      id: presc.id,
      text: `Prescription added for patient`,
      icon: "document-text",
      time: presc.created_at || presc.createdAt,
      type: "prescription",
    })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, limit)
    .map((activity) => ({ ...activity, time: getTimeAgo(activity.time) }));

  return activities;
};

const getUsers = async ({
  role,
  search,
  includeInactive,
  limit,
  page,
  ctx,
}) => {
  const scopedHospitalId = getScopedHospitalId(ctx);
  const skip = (page - 1) * limit;

  if (search && search.length > 100) {
    throw new AppError("Search query too long (max 100 characters)", 400);
  }

  const { rows, total } = await adminRepository.getUsers({
    role,
    search,
    hospitalId: scopedHospitalId,
    includeInactive,
    limit,
    skip,
  });

  const users = rows.map((row) => ({
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
    specialization: row.specialization,
    qualification: row.qualification,
    experience: row.experience,
    department: row.department,
    consultationFee: row.consultation_fee
      ? parseFloat(row.consultation_fee)
      : null,
    bio: row.bio,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    bloodGroup: row.blood_group,
    address: row.address,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelation: row.emergency_contact_relation,
  }));

  return { users, total, page, limit };
};

const updateUserStatus = async ({
  userId,
  isActive,
  adminUser,
  hospitalId,
}) => {
  if (typeof isActive !== "boolean") {
    throw new AppError("isActive must be a boolean value", 400);
  }

  const user = await userRepository.findByUserId(userId);
  if (!user) throw new AppError("User not found", 404);

  if (
    hospitalId &&
    adminUser.role !== "super_admin" &&
    user.hospital_id !== hospitalId
  ) {
    throw new AppError(
      "Access denied — user belongs to a different hospital",
      403,
    );
  }

  const updatedUser = await userRepository.update(user.id, { isActive });

  await invalidateCaches(
    CACHE_KEYS.USER,
    CACHE_KEYS.DOCTORS,
    CACHE_KEYS.DOCTOR,
    CACHE_KEYS.PATIENT,
    CACHE_KEYS.PATIENTS,
    CACHE_KEYS.ADMIN_USERS,
    CACHE_KEYS.DASHBOARD,
  );

  await writeAuditLog({
    userId: adminUser.id,
    action: AUDIT_ACTIONS.USER_STATUS_CHANGE,
    entityType: "user",
    entityId: user.id,
    oldValues: { isActive: user.is_active },
    newValues: { isActive },
  });

  return updatedUser;
};

const updateUserRole = async ({ userId, role, adminUser, hospitalId }) => {
  const validRoles = ["patient", "doctor", "admin"];
  if (!validRoles.includes(role)) {
    throw new AppError(
      `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      400,
    );
  }

  const user = await userRepository.findByUserId(userId);
  if (!user) throw new AppError("User not found", 404);

  if (
    hospitalId &&
    adminUser.role !== "super_admin" &&
    user.hospital_id !== hospitalId
  ) {
    throw new AppError(
      "Access denied — user belongs to a different hospital",
      403,
    );
  }

  if (user.role === "admin" && role !== "admin") {
    const adminCount = await adminRepository.countActiveAdmins();
    if (adminCount <= 1) {
      throw new AppError(
        "Cannot demote the last admin. Promote another user first.",
        400,
      );
    }
  }

  await adminRepository.updateUserRole(user.id, role);
  const updatedUser = await userRepository.findById(user.id);

  await invalidateCaches(
    CACHE_KEYS.USER,
    CACHE_KEYS.DOCTORS,
    CACHE_KEYS.DOCTOR,
    CACHE_KEYS.PATIENT,
    CACHE_KEYS.DASHBOARD,
  );

  await writeAuditLog({
    userId: adminUser.id,
    action: AUDIT_ACTIONS.ROLE_CHANGE,
    entityType: "user",
    entityId: user.id,
    oldValues: { role: user.role },
    newValues: { role },
  });

  return updatedUser;
};

const bulkUpdateUsers = async ({ operations, adminUser, hospitalId }) => {
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new AppError("Operations must be a non-empty array", 400);
  }
  if (operations.length > 100) {
    throw new AppError("Maximum 100 operations allowed per batch", 400);
  }

  const isSuperAdmin = adminUser.role === "super_admin";
  const scopedHospitalId = hospitalId && !isSuperAdmin ? hospitalId : null;

  const results = await adminRepository.bulkUpdateUsers(
    operations,
    scopedHospitalId,
    isSuperAdmin,
  );

  await invalidateCaches(
    CACHE_KEYS.USER,
    CACHE_KEYS.DOCTORS,
    CACHE_KEYS.PATIENT,
    CACHE_KEYS.DASHBOARD,
  );

  return results;
};

const getSecuritySettings = async (userId, ctx) => {
  const user = await userRepository.findByUserId(userId);
  if (!user) throw new AppError("User not found", 404);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scopedHospitalId = getScopedHospitalId(ctx);

  const [{ stats, totalActiveSessions }, myActiveSessions] = await Promise.all([
    adminRepository.getSecurityStats({
      sevenDaysAgo,
      today,
      hospitalId: scopedHospitalId,
    }),
    adminRepository.getUserActiveSessions(user.id),
  ]);

  const totalUsers = parseInt(stats.total_users, 10);
  const verifiedUsers = parseInt(stats.verified_users, 10);

  return {
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
      recentLogins: parseInt(stats.recent_logins, 10),
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
    },
    lastActivity: user.last_login ? getTimeAgo(user.last_login) : "Never",
  };
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required", 400);
  }
  if (newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters", 400);
  }
  if (currentPassword === newPassword) {
    throw new AppError(
      "New password must be different from current password",
      400,
    );
  }

  const user = await userRepository.findByUserId(userId);
  if (!user) throw new AppError("User not found", 404);

  const passwordHash = await adminRepository.getPasswordHash(user.id);
  if (!passwordHash) throw new AppError("User not found", 404);

  const isMatch = await bcrypt.compare(currentPassword, passwordHash);
  if (!isMatch) throw new AppError("Current password is incorrect", 401);

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await adminRepository.updatePasswordHash(user.id, newPasswordHash);
  const loggedOutSessions = await adminRepository.deleteAllUserSessions(
    user.id,
  );

  await invalidateCaches(CACHE_KEYS.SESSION);

  return { loggedOutSessions };
};

const logoutAllDevices = async (userId) => {
  const user = await userRepository.findByUserId(userId);
  if (!user) throw new AppError("User not found", 404);

  const loggedOutSessions = await adminRepository.deleteAllUserSessions(
    user.id,
  );
  await adminRepository.touchUser(user.id);

  await invalidateCaches(CACHE_KEYS.SESSION);

  return { loggedOutSessions };
};

const getSystemMetrics = async (ctx) => {
  const scopedHospitalId = getScopedHospitalId(ctx);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [userGrowth, appointmentTrends, activeUsers, totalUsers, dataSize] =
    await Promise.all([
      adminRepository.getUserGrowth(scopedHospitalId),
      adminRepository.getAppointmentTrends(scopedHospitalId),
      adminRepository.getActiveUsersCount(weekAgo, scopedHospitalId),
      adminRepository.getTotalUsersCount(scopedHospitalId),
      adminRepository.getDatabaseSize(),
    ]);

  return {
    userGrowth,
    appointmentTrends,
    activeUsers,
    totalUsers,
    database: {
      collections: 0,
      dataSize,
      indexSize: "0 kB",
      storageSize: dataSize,
    },
    timestamp: new Date(),
  };
};

const getMedicalRecordsOverview = async ({ patientId, limit, skip, ctx }) => {
  const scopedHospitalId = getScopedHospitalId(ctx);
  const sqlFilter = {};

  if (scopedHospitalId) sqlFilter.hospitalId = scopedHospitalId;
  if (patientId) sqlFilter.patientId = patientId;

  const [records, total] = await Promise.all([
    medicalRecordRepository.findWithFilters(sqlFilter, {
      limit,
      offset: skip,
      sort: "record_date DESC",
    }),
    medicalRecordRepository.count(sqlFilter),
  ]);

  // Aggregate record type counts
  const typeStats = await adminRepository.getMedicalRecordTypeStats(
    scopedHospitalId,
    patientId,
  );

  return { records, stats: typeStats, total };
};

const getNotificationsManagement = async ({
  type,
  status,
  limit,
  skip,
  ctx,
}) => {
  const scopedHospitalId = getScopedHospitalId(ctx);
  const filters = {};

  if (scopedHospitalId) filters.hospitalId = scopedHospitalId;
  if (type) filters.type = type;
  if (status) filters.read = status === "read";

  const [notifications, total, unreadCount] = await Promise.all([
    notificationRepository.findWithFilters(filters, { limit, offset: skip }),
    notificationRepository.count(filters),
    notificationRepository.count({ ...filters, read: false }),
  ]);

  // Get type distribution in SQL
  const typeStats = await adminRepository.getNotificationTypeStats(
    scopedHospitalId,
    type,
  );

  return { notifications, total, unreadCount, typeDistribution: typeStats };
};

const getAuditLogs = async ({
  userId: targetUserId,
  action,
  entityType,
  limit,
  page,
  ctx,
}) => {
  const scopedHospitalId = getScopedHospitalId(ctx);
  const offset = (page - 1) * limit;

  const { rows, total } = await adminRepository.getAuditLogs({
    hospitalId: scopedHospitalId,
    userId: targetUserId,
    action,
    entityType,
    limit,
    offset,
  });

  return { rows, total, page, limit };
};

const getSystemHealth = async () => {
  const services = { postgres: { connected: false } };

  try {
    await adminRepository.pingPostgres();
    services.postgres.connected = true;
  } catch (e) {
    logger.warn("Postgres health check failed:", e.message);
  }

  const issues = Object.values(services).filter((s) => !s.connected).length;
  return {
    success: true,
    data: {
      status: issues === 0 ? "good" : "critical",
      issues,
      database: { connected: services.postgres.connected },
      services,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  };
};

const createUser = async (req) => {
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

  if (!name || !email || !phone || !password || !role) {
    throw new AppError(
      "Name, email, phone, password, and role are required",
      400,
    );
  }
  if (!["doctor", "patient"].includes(role)) {
    throw new AppError("Role must be either doctor or patient", 400);
  }
  if (role === "doctor" && (!specialization || !qualification)) {
    throw new AppError(
      "Specialization and qualification are required for doctors",
      400,
    );
  }

  if (await userRepository.emailExists(email.toLowerCase())) {
    throw new AppError("Email already exists", 400);
  }
  if (await userRepository.phoneExists(phone)) {
    throw new AppError("Phone number already exists", 400);
  }

  const userId = await userRepository.getNextUserId(role);
  const passwordHash = await bcrypt.hash(password, 10);

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
    await adminRepository.createDoctorProfile(
      user.id,
      specialization,
      qualification,
      experience || 0,
      department || specialization,
      consultationFee ?? 500,
      normalizedLicenseNumber,
      bio || null,
      JSON.stringify(normalizedAvailability),
    );
  } else if (role === "patient") {
    const patientFields = ["user_id"];
    const patientValues = [user.id];
    if (dateOfBirth) {
      patientFields.push("date_of_birth");
      patientValues.push(dateOfBirth);
    }
    if (gender) {
      patientFields.push("gender");
      patientValues.push(gender);
    }
    if (bloodGroup) {
      patientFields.push("blood_group");
      patientValues.push(bloodGroup);
    }
    if (address) {
      patientFields.push("address");
      patientValues.push(address);
    }
    if (emergencyContactName) {
      patientFields.push("emergency_contact_name");
      patientValues.push(emergencyContactName);
    }
    if (emergencyContactPhone) {
      patientFields.push("emergency_contact_phone");
      patientValues.push(emergencyContactPhone);
    }
    if (emergencyContactRelation) {
      patientFields.push("emergency_contact_relation");
      patientValues.push(emergencyContactRelation);
    }
    if (Array.isArray(allergies) && allergies.length > 0) {
      patientFields.push("allergies");
      patientValues.push(allergies);
    }
    if (Array.isArray(chronicConditions) && chronicConditions.length > 0) {
      patientFields.push("chronic_conditions");
      patientValues.push(chronicConditions);
    }

    const placeholders = patientValues
      .map((_, idx) => `$${idx + 1}`)
      .join(", ");
    await adminRepository.createPatientProfile(
      `INSERT INTO patients (${patientFields.join(", ")}) VALUES (${placeholders})`,
      patientValues,
    );
  }

  let userResponse = user;
  if (role === "doctor") {
    const doc = await doctorRepository.findByUserId(user.id);
    if (doc) userResponse = { ...userResponse, ...doc };
  } else if (role === "patient") {
    const pat = await patientRepository.findByUserId(user.id);
    if (pat) userResponse = { ...userResponse, ...pat };
  }

  await invalidateCaches(
    "v1:cache:user:*",
    "v1:cache:doctors:*",
    "v1:cache:doctor:*",
    "v1:cache:patient:*",
    "v1:cache:*patients*",
    "v1:cache:/api/admin/users*",
    "v1:cache:dashboard:*",
  );
  await writeAuditLog({
    userId: req.user.id,
    action: AUDIT_ACTIONS.USER_REGISTER,
    entityType: "user",
    entityId: user.id,
    newValues: { userId: user.userId, role, email: user.email },
    req,
  });

  return { user: userResponse };
};

const updateUserProfile = async (req) => {
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

  const user = await userRepository.findByUserId(userId);
  if (!user) throw new AppError("User not found or access denied", 404);
  if (
    req.hospitalId &&
    req.user.role !== "super_admin" &&
    user.hospital_id !== req.hospitalId
  ) {
    throw new AppError("Access denied", 403);
  }

  if (email && email.toLowerCase() !== user.email) {
    if (
      await adminRepository.checkDuplicateEmail(email.toLowerCase(), user.id)
    ) {
      throw new AppError("Email already exists", 400);
    }
  }
  if (phone && phone !== user.phone) {
    if (await adminRepository.checkDuplicatePhone(phone, user.id)) {
      throw new AppError("Phone number already exists", 400);
    }
  }

  const updates = {};
  if (name) updates.name = name.trim();
  if (email) updates.email = email.toLowerCase().trim();
  if (phone) updates.phone = phone.trim();
  if (Object.keys(updates).length > 0)
    await userRepository.update(user.id, updates);

  if (user.role === "doctor") {
    if (!(await adminRepository.checkDoctorExists(user.id))) {
      throw new AppError("Doctor profile not found.", 404);
    }
    const doctorUpdates = [];
    const doctorValues = [];
    let paramIndex = 1;
    if (specialization) {
      doctorUpdates.push(`specialization = $${paramIndex++}`);
      doctorValues.push(specialization);
    }
    if (qualification) {
      doctorUpdates.push(`qualification = $${paramIndex++}`);
      doctorValues.push(qualification);
    }
    if (experience !== undefined) {
      doctorUpdates.push(`experience = $${paramIndex++}`);
      doctorValues.push(experience);
    }
    if (department) {
      doctorUpdates.push(`department = $${paramIndex++}`);
      doctorValues.push(department);
    }
    if (consultationFee !== undefined) {
      doctorUpdates.push(`consultation_fee = $${paramIndex++}`);
      doctorValues.push(consultationFee);
    }
    const normalizedLicenseNumber = licenseNumber ?? license_number;
    if (normalizedLicenseNumber !== undefined) {
      doctorUpdates.push(`license_number = $${paramIndex++}`);
      doctorValues.push(normalizedLicenseNumber || null);
    }
    if (bio !== undefined) {
      doctorUpdates.push(`bio = $${paramIndex++}`);
      doctorValues.push(bio || null);
    }
    if (availability !== undefined) {
      doctorUpdates.push(`availability = $${paramIndex++}`);
      doctorValues.push(JSON.stringify(availability || {}));
    }

    if (doctorUpdates.length > 0) {
      doctorValues.push(user.id);
      const res = await adminRepository.updateDoctorProfile(
        `UPDATE doctors SET ${doctorUpdates.join(", ")}, updated_at = NOW() WHERE user_id = $${paramIndex}`,
        doctorValues,
      );
      if (res === 0)
        throw new AppError("Failed to update doctor profile.", 500);
    }
  } else if (user.role === "patient") {
    if (!(await adminRepository.checkPatientExists(user.id))) {
      throw new AppError("Patient profile not found.", 404);
    }
    const patientUpdates = [];
    const patientValues = [];
    let paramIndex = 1;
    if (dateOfBirth) {
      patientUpdates.push(`date_of_birth = $${paramIndex++}`);
      patientValues.push(dateOfBirth);
    }
    if (gender) {
      patientUpdates.push(`gender = $${paramIndex++}`);
      patientValues.push(gender);
    }
    if (bloodGroup) {
      patientUpdates.push(`blood_group = $${paramIndex++}`);
      patientValues.push(bloodGroup);
    }
    if (address) {
      patientUpdates.push(`address = $${paramIndex++}`);
      patientValues.push(address);
    }
    if (emergencyContactName) {
      patientUpdates.push(`emergency_contact_name = $${paramIndex++}`);
      patientValues.push(emergencyContactName);
    }
    if (emergencyContactPhone) {
      patientUpdates.push(`emergency_contact_phone = $${paramIndex++}`);
      patientValues.push(emergencyContactPhone);
    }
    if (emergencyContactRelation) {
      patientUpdates.push(`emergency_contact_relation = $${paramIndex++}`);
      patientValues.push(emergencyContactRelation);
    }
    if (Array.isArray(allergies)) {
      patientUpdates.push(`allergies = $${paramIndex++}`);
      patientValues.push(allergies);
    }
    if (Array.isArray(chronicConditions)) {
      patientUpdates.push(`chronic_conditions = $${paramIndex++}`);
      patientValues.push(chronicConditions);
    }

    if (patientUpdates.length > 0) {
      patientValues.push(user.id);
      const res = await adminRepository.updatePatientProfile(
        `UPDATE patients SET ${patientUpdates.join(", ")}, updated_at = NOW() WHERE user_id = $${paramIndex}`,
        patientValues,
      );
      if (res === 0)
        throw new AppError("Failed to update patient profile.", 500);
    }
  }

  let userResponse = await userRepository.findById(user.id);
  if (user.role === "doctor") {
    const doc = await doctorRepository.findByUserId(user.id);
    if (doc) userResponse = { ...userResponse, ...doc };
  } else if (user.role === "patient") {
    const pat = await patientRepository.findByUserId(user.id);
    if (pat) userResponse = { ...userResponse, ...pat };
  }

  await invalidateCaches(
    "v1:cache:user:*",
    "v1:cache:doctors:*",
    "v1:cache:doctor:*",
    "v1:cache:patient:*",
    "v1:cache:*patients*",
    "v1:cache:dashboard:*",
  );
  return { user: userResponse };
};

const deleteUser = async (req) => {
  const { userId } = req.params;
  const user = await userRepository.findByUserId(userId);
  if (!user) throw new AppError("User not found or access denied", 404);
  if (
    req.hospitalId &&
    req.user.role !== "super_admin" &&
    user.hospital_id !== req.hospitalId
  ) {
    throw new AppError("Access denied", 403);
  }
  if (["admin", "super_admin"].includes(user.role)) {
    throw new AppError("Cannot delete admin users", 403);
  }

  if (user.role === "doctor") {
    const activeAppointments = await adminRepository.countActiveAppointments(
      user.id,
      new Date(),
    );
    if (activeAppointments > 0) {
      throw new AppError(
        `Cannot delete doctor with ${activeAppointments} active appointments.`,
        400,
      );
    }
  }

  await userRepository.update(user.id, { isActive: false });
  await invalidateCaches(
    "v1:cache:user:*",
    "v1:cache:doctors:*",
    "v1:cache:doctor:*",
    "v1:cache:patient:*",
    "v1:cache:*patients*",
    "v1:cache:/api/admin/users*",
    "v1:cache:dashboard:*",
  );

  return { userId: user.user_id, deletedAt: new Date() };
};

const permanentDeleteUser = async (req) => {
  const { userId } = req.params;
  const user = await userRepository.findByUserId(userId);
  if (!user) throw new AppError("User not found", 404);
  if (
    req.hospitalId &&
    req.user.role !== "super_admin" &&
    user.hospital_id !== req.hospitalId
  ) {
    throw new AppError("Access denied", 403);
  }
  if (["admin", "super_admin"].includes(user.role)) {
    throw new AppError("Cannot permanently delete admin users", 403);
  }

  if (user.role === "doctor") {
    const activeAppointments = await adminRepository.countActiveAppointments(
      user.id,
      new Date(),
    );
    if (activeAppointments > 0) {
      throw new AppError(
        `Cannot delete doctor with ${activeAppointments} active appointments.`,
        400,
      );
    }
  }

  // Atomically delete all records in Postgres (in proper dependency order)
  await adminRepository.purgeUserData(user);

  await writeAuditLog({
    userId: req.user.id,
    action: AUDIT_ACTIONS.USER_DELETE,
    entityType: "user",
    entityId: user.id,
    oldValues: { userId: user.user_id, role: user.role, email: user.email },
    req,
  });

  await invalidateCaches(
    "v1:cache:user:*",
    "v1:cache:doctors:*",
    "v1:cache:doctor:*",
    "v1:cache:patient:*",
    "v1:cache:*patients*",
    "v1:cache:/api/admin/users*",
    "v1:cache:dashboard:*",
  );

  return {
    userId: user.user_id,
    deletedAt: new Date(),
    deletedBy: req.user.userId,
  };
};

module.exports = {
  permanentDeleteUser,
  deleteUser,
  updateUserProfile,
  createUser,
  getSystemHealth,
  getDashboardStats,
  getRecentActivities,
  getUsers,
  updateUserStatus,
  updateUserRole,
  bulkUpdateUsers,
  getSecuritySettings,
  changePassword,
  logoutAllDevices,
  getSystemMetrics,
  getMedicalRecordsOverview,
  getNotificationsManagement,
  getAuditLogs,
};
