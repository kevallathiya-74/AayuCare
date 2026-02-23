/**
 * Patient Controller
 * Handles patient management, search, and medical history
 */

const userRepository = require("../repositories/userRepository");
const patientRepository = require("../repositories/patientRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const medicalRecordRepository = require("../repositories/medicalRecordRepository");
const healthMetricRepository = require("../repositories/healthMetricRepository");
const logger = require("../utils/logger");
const { deleteCacheByPattern } = require("../config/redis");

/**
 * Helper to check if the requesting user is the same as the target patient
 * Handles both MongoDB _id and custom userId formats
 * @param {Object} user - The authenticated user (req.user)
 * @param {String} patientId - The patient identifier from request params
 * @returns {Boolean} - True if user is the same patient
 */
const isOwnPatientData = (user, patientId) => {
  // Check against PostgreSQL UUID id
  if (user.id && user.id === patientId) return true;
  // Check against custom userId (e.g., "PAT001", "PAT9")
  if (user.userId && user.userId === patientId) return true;
  // Check against MongoDB _id (ObjectId as string)
  if (user._id && user._id.toString() === patientId) return true;
  return false;
};

/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth
 * @returns {number|null}
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

/**
 * @desc    Search patients by name, ID, phone, or email (or get all if no query)
 * @route   GET /api/patients/search?q=query
 * @access  Private (Doctor/Admin)
 */
exports.searchPatients = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get hospitalId from request (set by hospitalMiddleware)
    const hospitalId = req.hospitalId && req.user.role !== "super_admin" ? req.hospitalId : "MAIN";

    // Sanitize search query if provided
    const searchTerm = q && q.trim().length >= 1 ? q.trim() : '';

    // Get patients with search from repository
    const result = await userRepository.findPatientsByHospital(
      hospitalId,
      parseInt(limit),
      offset,
      searchTerm
    );

    res.json({
      status: "success",
      message: "Patients retrieved successfully",
      data: result.data, // Return the data array from repository
      patients: result.data, // Also include as 'patients' for backward compatibility
      count: result.data.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: Math.ceil(result.total / result.limit)
    });
  } catch (error) {
    logger.error("Patient search error:", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get complete medical history of a patient
 * @route   GET /api/patients/:patientId/complete-history
 * @access  Private (Doctor/Admin or Patient own data)
 */
exports.getCompleteHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this patient data",
      });
    }

    // Get patient profile - try both id and userId
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Verify hospital access
    if (req.hospitalId && req.user.role !== "super_admin" && patient.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this patient"
      });
    }

    // Use patient id for querying related collections
    const patientDbId = patient.id;

    // Fetch patient profile from patients table for medical fields
    const patientProfile = await patientRepository.findByUserId(patientDbId);

    // Get all medical records (sorted by most recent) - MongoDB collection
    const recordQuery = { patientId: patientDbId };
    if (req.hospitalId && req.user.role !== "super_admin") {
      recordQuery.hospitalId = req.hospitalId;
    }
    const medicalRecords = await medicalRecordRepository.findWithFilters(recordQuery, {
      populate: { doctorId: "name specialization userId isActive" },
      sort: { createdAt: -1 },
      lean: true
    });

    // Get all appointments (sorted by most recent) - PostgreSQL
    const appointmentFilters = {
      sortBy: "appointment_date",
      sortOrder: "DESC"
    };
    if (req.hospitalId && req.user.role !== "super_admin") {
      appointmentFilters.hospitalId = req.hospitalId;
    }
    const appointments = await appointmentRepository.findByPatient(patientDbId, appointmentFilters);

    // Get all prescriptions (sorted by most recent) - MongoDB
    const prescriptionFilters = {
      sortBy: "createdAt",
      sortOrder: "DESC"
    };
    if (req.hospitalId && req.user.role !== "super_admin") {
      prescriptionFilters.hospitalId = req.hospitalId;
    }
    const prescriptions = await prescriptionRepository.findByPatient(patientDbId, prescriptionFilters);

    // Calculate health statistics
    const stats = {
      totalVisits: appointments.filter((a) => a.status === "completed").length,
      totalRecords: medicalRecords.length,
      totalPrescriptions: prescriptions.length,
      upcomingAppointments: appointments.filter(
        (a) =>
          a.status === "scheduled" && new Date(a.appointmentDate) > new Date()
      ).length,
      lastVisit:
        appointments.length > 0 ? appointments[0].appointmentDate : null,
    };

    // Get recent vitals from medical records
    const recentVitals = medicalRecords
      .filter((r) => r.vitals && Object.keys(r.vitals).length > 0)
      .slice(0, 5)
      .map((r) => ({
        date: r.createdAt,
        vitals: r.vitals,
      }));

    // Compile complete history
    const completeHistory = {
      patient,
      stats,
      recentVitals,
      medicalRecords,
      appointments,
      prescriptions,
      summary: {
        allergies: patientProfile?.allergies || [],
        bloodGroup: patientProfile?.blood_group || "Not specified",
        chronicConditions: patientProfile?.chronic_conditions || [],
        age: calculateAge(patientProfile?.date_of_birth),
        gender: patientProfile?.gender || null,
      },
    };

    res.json({
      success: true,
      data: completeHistory,
    });
  } catch (error) {
    logger.error("Complete history error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.params.patientId,
    });
    next(error);
  }
};

/**
 * @desc    Get patient profile with basic info
 * @route   GET /api/patients/:patientId/profile
 * @access  Private (Doctor/Admin or Patient own data)
 */
exports.getPatientProfile = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this patient data",
      });
    }

    // Get patient profile
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }
    
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Verify hospital access
    if (req.hospitalId && req.user.role !== "super_admin" && patient.hospital_id !== req.hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this patient"
      });
    }

    // Get quick stats using patient id
    const statsQuery = { patientId: patient.id };
    if (req.hospitalId && req.user.role !== "super_admin") {
      statsQuery.hospitalId = req.hospitalId;
    }
    
    const [recordCount, appointmentCounts, prescriptionCount] =
      await Promise.all([
        medicalRecordRepository.count(statsQuery),
        appointmentRepository.countByStatus(patient.id, "patient", req.hospitalId),
        prescriptionRepository.findByPatient(patient.id, {}).then(p => p.length),
      ]);

    const normalizedPatient = {
      ...patient,
      id: patient.id,
      userId: patient.userId || patient.user_id || null,
      hospitalId: patient.hospitalId || patient.hospital_id || null,
      hospitalName: patient.hospitalName || patient.hospital_name || null,
      isActive: patient.isActive ?? patient.is_active ?? true,
      emailVerified: patient.emailVerified ?? patient.email_verified ?? false,
    };

    res.json({
      success: true,
      data: {
        ...normalizedPatient,
        stats: {
          totalRecords: recordCount,
          totalAppointments: appointmentCounts.total || 0,
          totalPrescriptions: prescriptionCount,
        },
      },
    });
  } catch (error) {
    logger.error("Patient profile error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.params.patientId,
    });
    next(error);
  }
};

/**
 * @desc    Update patient profile
 * @route   PATCH /api/patients/:patientId/profile
 * @access  Private (Patient own data or Admin)
 */
exports.updatePatientProfile = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check access rights - supports both _id and userId formats
    if (req.user.role !== "admin" && !isOwnPatientData(req.user, patientId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this patient data",
      });
    }

    const allowedUserUpdates = ["name", "phone"];
    const allowedPatientUpdates = [
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "address",
      "emergencyContactName",
      "emergencyContactPhone",
      "emergencyContactRelation",
      "allergies",
      "chronicConditions",
    ];

    const userUpdates = {};
    const patientUpdates = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUserUpdates.includes(key)) {
        userUpdates[key] = req.body[key];
      }

      if (allowedPatientUpdates.includes(key)) {
        patientUpdates[key] = req.body[key];
      }
    });

    if (
      Object.keys(userUpdates).length === 0 &&
      Object.keys(patientUpdates).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided",
      });
    }

    // Find patient by userId or id
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    
    let updatedUser = patient;
    if (Object.keys(userUpdates).length > 0) {
      updatedUser = await userRepository.update(patient.id, userUpdates);
    }

    if (Object.keys(patientUpdates).length > 0) {
      await patientRepository.update(patient.id, patientUpdates);
    }

    const refreshedPatientProfile = await patientRepository.findByUserId(patient.id);

    const updatedPatient = {
      id: updatedUser.id,
      userId: updatedUser.userId || updatedUser.user_id || refreshedPatientProfile?.formatted_user_id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      hospitalId: updatedUser.hospitalId || updatedUser.hospital_id,
      hospitalName: updatedUser.hospitalName || updatedUser.hospital_name,
      isActive: updatedUser.isActive ?? updatedUser.is_active,
      dateOfBirth: refreshedPatientProfile?.date_of_birth || null,
      gender: refreshedPatientProfile?.gender || null,
      bloodGroup: refreshedPatientProfile?.blood_group || null,
      address: refreshedPatientProfile?.address || null,
      emergencyContactName: refreshedPatientProfile?.emergency_contact_name || null,
      emergencyContactPhone: refreshedPatientProfile?.emergency_contact_phone || null,
      emergencyContact: {
        name: refreshedPatientProfile?.emergency_contact_name || null,
        phone: refreshedPatientProfile?.emergency_contact_phone || null,
        relation: refreshedPatientProfile?.emergency_contact_relation || null,
      },
      allergies: refreshedPatientProfile?.allergies || [],
      chronicConditions: refreshedPatientProfile?.chronic_conditions || [],
      medicalHistory: refreshedPatientProfile?.chronic_conditions || [],
    };

    // Invalidate relevant caches after patient profile update
    try {
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after patient profile update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: "Profile Updated Successfully",
      data: updatedPatient,
    });
  } catch (error) {
    logger.error("Patient profile update error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.params.patientId,
    });
    next(error);
  }
};

/**
 * @desc    Get health metrics for a patient
 * @route   GET /api/patients/:patientId/health-metrics
 * @access  Private (Patient own data, Doctor, or Admin)
 */
exports.getHealthMetrics = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this patient data",
      });
    }

    // Fetch all metrics for the patient - handle both id and userId
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const patientIdValue = patient.id;
    const metricsQuery = { patient: patientIdValue };
    if (req.hospitalId && req.user.role !== "super_admin") {
      metricsQuery.hospitalId = req.hospitalId;
    }
    
    const metrics = await healthMetricRepository.findWithFilters(metricsQuery, {
      sort: { timestamp: -1 },
      limit: 100,
      lean: true
    });

    res.json({
      success: true,
      count: metrics.length,
      data: metrics,
    });
  } catch (error) {
    logger.error("Get health metrics error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.params.patientId,
    });
    next(error);
  }
};

/**
 * @desc    Add health metric
 * @route   POST /api/patients/:patientId/health-metrics
 * @access  Private
 */
exports.addHealthMetric = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { type, value, notes, timestamp } = req.body;

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add metrics for this patient",
      });
    }

    // Validate metric type against HealthMetric model enum
    const validTypes = ['bp','sugar','weight','bmi','temperature','steps','sleep','water','exercise','stress','heart-rate','oxygen'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid metric type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Resolve patient using PostgreSQL repository (users are NOT in MongoDB)
    let patient;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (uuidRegex.test(patientId)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }

    // Use patient's UUID string as the 'patient' field (HealthMetric.patient is String)
    const patientUUID = patient ? patient.id : patientId;
    const metric = await healthMetricRepository.create({
      patient: patientUUID,
      hospitalId: req.hospitalId || req.user.hospitalId || "MAIN",
      type,
      value,
      notes,
      timestamp: timestamp || Date.now(),
      recordedBy: req.user.id,
      source: req.user.role === "doctor" ? "doctor" : "manual",
    });

    // Invalidate patient-related caches after adding health metric
    try {
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:health:*");
      await deleteCacheByPattern("cache:health:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after health metric addition");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(201).json({
      success: true,
      message: "Health metric added successfully",
      data: metric,
    });
  } catch (error) {
    logger.error("Add health metric error:", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get activity tracking data (steps, sleep, water, stress)
 * @route   GET /api/patients/:patientId/activity
 * @access  Private
 */
exports.getActivityData = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this patient data",
      });
    }

    // Resolve patient using PostgreSQL repository (users are NOT in MongoDB)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let activityPatient;
    if (uuidRegex.test(patientId)) {
      activityPatient = await userRepository.findById(patientId);
    } else {
      activityPatient = await userRepository.findByUserId(patientId);
    }

    const patientObjectId = activityPatient ? activityPatient.id : patientId;
    const activityTypes = ["steps", "sleep", "water", "exercise", "stress"];

    // Get latest activity metrics
    const latestMetrics = await healthMetricRepository.getLatestMetrics(
      patientObjectId,
      activityTypes
    );

    // Get today's metrics for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMetricsQuery = {
      patient: patientObjectId,
      type: { $in: activityTypes },
      timestamp: { $gte: today },
    };
    if (req.hospitalId && req.user.role !== "super_admin") {
      todayMetricsQuery.hospitalId = req.hospitalId;
    }
    
    const todayMetrics = await healthMetricRepository.findWithFilters(todayMetricsQuery, { lean: true });

    res.json({
      success: true,
      data: {
        latest: latestMetrics,
        today: todayMetrics,
      },
    });
  } catch (error) {
    logger.error("Get activity data error:", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Update activity data (steps, water, etc.)
 * @route   POST /api/patients/:patientId/activity
 * @access  Private
 */
exports.updateActivityData = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { type, value, notes } = req.body;

    // Check access rights - supports both _id and userId formats
    if (!isOwnPatientData(req.user, patientId) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update activity for this patient",
      });
    }

    // Validate activity type
    const validTypes = ["steps", "sleep", "water", "exercise", "stress"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity type",
      });
    }

    // Resolve patient using PostgreSQL repository (users are NOT in MongoDB)
    const uuidRegexActivity = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let updateActivityPatient;
    if (uuidRegexActivity.test(patientId)) {
      updateActivityPatient = await userRepository.findById(patientId);
    } else {
      updateActivityPatient = await userRepository.findByUserId(patientId);
    }

    const updatePatientId = updateActivityPatient ? updateActivityPatient.id : patientId;
    const metric = await healthMetricRepository.create({
      patient: updatePatientId,
      hospitalId: req.hospitalId || req.user.hospitalId || "MAIN",
      type,
      value,
      notes,
      recordedBy: req.user.id,
      source: "app",
    });

    // Invalidate patient-related caches after activity update
    try {
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:health:*");
      await deleteCacheByPattern("cache:health:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after activity data update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(201).json({
      success: true,
      message: "Activity data updated successfully",
      data: metric,
    });
  } catch (error) {
    logger.error("Update activity data error:", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};
/**
 * @desc    Get latest health metric by type
 * @route   GET /api/patients/:patientId/health-metrics/latest/:type
 * @access  Private
 */
exports.getLatestHealthMetric = async (req, res, next) => {
  try {
    const { patientId, type } = req.params;

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this patient data",
      });
    }

    // Resolve patient using PostgreSQL repository (users are NOT in MongoDB)
    const uuidRegexLatest = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let latestPatient;
    if (uuidRegexLatest.test(patientId)) {
      latestPatient = await userRepository.findById(patientId);
    } else {
      latestPatient = await userRepository.findByUserId(patientId);
    }

    const latestPatientId = latestPatient ? latestPatient.id : patientId;
    const metricsQuery = { patient: latestPatientId, type };
    if (req.hospitalId && req.user.role !== "super_admin") {
      metricsQuery.hospitalId = req.hospitalId;
    }
    
    const latestMetricResult = await healthMetricRepository.findWithFilters(metricsQuery, {
      sort: { timestamp: -1 },
      limit: 1,
      lean: true
    });
    const latestMetric = latestMetricResult.length > 0 ? latestMetricResult[0] : null;

    if (!latestMetric) {
      return res.status(404).json({
        success: false,
        message: `No ${type} metrics found for this patient`,
      });
    }

    res.json({
      success: true,
      data: latestMetric,
    });
  } catch (error) {
    logger.error("Get latest health metric error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.params.patientId,
      type: req.params.type,
    });
    next(error);
  }
};

/**
 * @desc    Delete health metric
 * @route   DELETE /api/patients/:patientId/health-metrics/:metricId
 * @access  Private (Patient own data or Admin)
 */
exports.updateHealthMetric = async (req, res, next) => {
  try {
    const { patientId, metricId } = req.params;
    const { value, notes, timestamp } = req.body;

    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update metrics for this patient",
      });
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let patient;
    if (uuidRegex.test(patientId)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }
    const resolvedPatientId = patient ? patient.id : patientId;

    const existing = await healthMetricRepository.findWithFilters(
      { _id: metricId, patient: resolvedPatientId },
      { limit: 1 }
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Metric not found" });
    }

    const updates = {};
    if (value !== undefined) updates.value = value;
    if (notes !== undefined) updates.notes = notes;
    if (timestamp !== undefined) updates.timestamp = timestamp;

    const updated = await healthMetricRepository.update(metricId, updates);

    try {
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:health:*");
      await deleteCacheByPattern("cache:health:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after health metric update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: "Health metric updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error("Update health metric error:", {
      error: error.message,
      stack: error.stack,
      metricId: req.params.metricId,
    });
    next(error);
  }
};

exports.deleteHealthMetric = async (req, res, next) => {
  try {
    const { patientId, metricId } = req.params;

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete metrics for this patient",
      });
    }

    // Resolve patient using PostgreSQL repository (users are NOT in MongoDB)
    const uuidRegexDel = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let deletePatient;
    if (uuidRegexDel.test(patientId)) {
      deletePatient = await userRepository.findById(patientId);
    } else {
      deletePatient = await userRepository.findByUserId(patientId);
    }

    const deletePatientId = deletePatient ? deletePatient.id : patientId;
    
    // First find the metric to verify it belongs to the patient
    const existingMetric = await healthMetricRepository.findWithFilters({
      _id: metricId,
      patient: deletePatientId,
    }, { limit: 1 });
    
    if (existingMetric.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Metric not found",
      });
    }
    
    const metric = existingMetric[0];
    await healthMetricRepository.delete(metricId);

    // Invalidate patient-related caches after metric deletion
    try {
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:health:*");
      await deleteCacheByPattern("cache:health:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after health metric deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: "Health metric deleted successfully",
      data: metric,
    });
  } catch (error) {
    logger.error("Delete health metric error:", {
      error: error.message,
      stack: error.stack,
      metricId: req.params.metricId,
    });
    next(error);
  }
};
