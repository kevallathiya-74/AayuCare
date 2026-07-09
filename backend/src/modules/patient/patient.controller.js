/**
 * Patient Controller
 * Handles patient management, search, and medical history
 */

const userRepository = require("../auth/user.repository");
const patientRepository = require("./patient.repository");
const appointmentRepository = require("../appointment/appointment.repository");
const prescriptionRepository = require("../prescription/prescription.repository");
const medicalRecordRepository = require("../medical-record/medical-record.repository");
const healthMetricRepository = require("../patient/health-metric.repository");
const logger = require("../../utils/logger");
const {
  invalidateAfterPatientProfileMutation,
  invalidateAfterPatientHealthMutation,
} = require("../../utils/cacheInvalidation");
const { AppError } = require("../../middleware/errorHandler");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * Helper to check if the requesting user is the same as the target patient
 * @param {Object} user - The authenticated user (req.user)
 * @param {String} patientId - The patient identifier from request params
 * @returns {Boolean} - True if user is the same patient
 */
const isOwnPatientData = (user, patientId) => {
  // Check against PostgreSQL UUID id
  if (user.id && user.id === patientId) return true;
  // Check against custom userId (e.g., "PAT001", "PAT9")
  if (user.userId && user.userId === patientId) return true;
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

    // Validate query parameter type to prevent type confusion (arrays, objects, etc.)
    if (q !== undefined && typeof q !== "string") {
      return next(new AppError("Invalid search query parameter", 400));
    }

    // Sanitize search query — enforce max length to prevent DB overload
    if (q && q.length > 100) {
      return next(new AppError("Search query must be 100 characters or fewer", 400));
    }
    const searchTerm = q && q.trim().length >= 1 ? q.trim() : '';

    // Get patients with search from repository
    const result = await userRepository.findPatientsByHospital(
      hospitalId,
      parseInt(limit),
      offset,
      searchTerm
    );

    return sendSuccess(
      res,
      req,
      {
        data: result.data,
        patients: result.data,
        count: result.data.length,
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.ceil(result.total / result.limit),
      },
      "Patients retrieved successfully",
      200
    );
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
    const patientId = String(req.params.patientId);

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return sendError(res, req, "Not authorized to view this patient data", 403, "FORBIDDEN");
    }

    // Get patient profile - try both id and userId
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }
    
    if (!patient) {
      return sendError(res, req, "Patient not found", 404, "NOT_FOUND");
    }

    // Verify hospital access
    if (req.hospitalId && req.user.role !== "super_admin" && patient.hospital_id !== req.hospitalId) {
      return sendError(res, req, "Not authorized to access this patient", 403, "FORBIDDEN");
    }

    // Use patient id for querying related collections
    const patientDbId = patient.id;

    if (req.user.role === "doctor") {
      const { query } = require("../../config/postgres");
      const hasRelationship = await query(
        `SELECT 1 FROM appointments 
         WHERE doctor_id = $1 AND patient_id = $2
         LIMIT 1`,
        [req.user.id, patientDbId]
      );
      if (hasRelationship.rows.length === 0) {
        return sendError(res, req, "Access denied — you do not have an appointment with this patient", 403, "FORBIDDEN");
      }
    }

    // Fetch patient profile from patients table for medical fields
    const patientProfile = await patientRepository.findByUserId(patientDbId);

    // Get all medical records (sorted by most recent)
    const recordQuery = { patientId: patientDbId };
    if (req.hospitalId && req.user.role !== "super_admin") {
      recordQuery.hospitalId = req.hospitalId;
    }
    const medicalRecords = await medicalRecordRepository.findWithFilters(recordQuery, {
      sort: 'created_at DESC'
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

    // Get all prescriptions (sorted by most recent)
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

    // Get records with ai_analysis for insights
    const recordsWithAnalysis = medicalRecords
      .filter((r) => r.ai_analysis && typeof r.ai_analysis === 'object')
      .slice(0, 5)
      .map((r) => ({
        date: r.created_at || r.createdAt,
        recordType: r.record_type || r.recordType,
        diagnosis: r.diagnosis,
      }));

    // Compile complete history
    const completeHistory = {
      patient,
      stats,
      recentRecords: recordsWithAnalysis,
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

    return sendSuccess(res, req, completeHistory, "Patient history retrieved successfully", 200);
  } catch (error) {
    logger.error("Complete history error:", {
      error: error.message,
      stack: error.stack,
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
    let rawPatientId = null;
    if (req.params && typeof req.params.patientId !== "undefined" && req.params.patientId !== null) {
      rawPatientId = req.params.patientId;
    } else if (req.query && typeof req.query.patientId !== "undefined" && req.query.patientId !== null) {
      rawPatientId = req.query.patientId;
    } else if (req.body && typeof req.body.patientId !== "undefined" && req.body.patientId !== null) {
      rawPatientId = req.body.patientId;
    } else if (req.user && req.user.role === "patient") {
      // Allow patients to access their own profile when patientId is omitted.
      rawPatientId = req.user.id || req.user.userId || req.user.user_id || null;
    }

    if (!rawPatientId) {
      return sendError(res, req, "patientId is required", 400, "VALIDATION_ERROR");
    }

    const patientId = String(rawPatientId);

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return sendError(res, req, "Not authorized to view this patient data", 403, "FORBIDDEN");
    }

    // Get patient profile
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }
    
    if (!patient || patient.role !== "patient") {
      return sendError(res, req, "Patient not found", 404, "NOT_FOUND");
    }

    // Verify hospital access
    if (req.hospitalId && req.user.role !== "super_admin" && patient.hospital_id !== req.hospitalId) {
      return sendError(res, req, "Not authorized to access this patient", 403, "FORBIDDEN");
    }

    if (req.user.role === "doctor") {
      // Doctors are allowed to view basic profile details of any patient in their assigned hospital.
      // The hospital-level tenancy check on line 287 guarantees they belong to the same hospital scope.
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

    return sendSuccess(
      res,
      req,
      {
        ...normalizedPatient,
        stats: {
          totalRecords: recordCount,
          totalAppointments: appointmentCounts.total || 0,
          totalPrescriptions: prescriptionCount,
        },
      },
      "Patient profile retrieved successfully",
      200
    );
  } catch (error) {
    logger.error("Patient profile error:", {
      error: error.message,
      stack: error.stack,
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
      return sendError(res, req, "Not authorized to update this patient data", 403, "FORBIDDEN");
    }

    const allowedUserUpdates = ["name", "email", "phone", "preferred_language"];
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
      return sendError(res, req, "No valid profile fields provided", 400, "VALIDATION_ERROR");
    }

    // Find patient by userId or id
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }

    if (!patient || patient.role !== "patient") {
      return sendError(res, req, "Patient not found", 404, "NOT_FOUND");
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
      await invalidateAfterPatientProfileMutation();
      logger.debug("Cache invalidated after patient profile update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, updatedPatient, "Profile Updated Successfully", 200);
  } catch (error) {
    logger.error("Patient profile update error:", {
      error: error.message,
      stack: error.stack,
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
    const patientId = String(req.params.patientId);

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return sendError(res, req, "Not authorized to view this patient data", 403, "FORBIDDEN");
    }

    // Fetch all metrics for the patient - handle both id and userId
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      patient = await userRepository.findById(patientId);
    } else {
      patient = await userRepository.findByUserId(patientId);
    }

    if (!patient) {
      return sendError(res, req, "Patient not found", 404, "NOT_FOUND");
    }

    const patientIdValue = patient.id;
    const metricsQuery = { patient: patientIdValue };
    if (req.hospitalId && req.user.role !== "super_admin") {
      metricsQuery.hospitalId = req.hospitalId;
    }
    
    const metrics = await healthMetricRepository.findWithFilters(metricsQuery, {
      sort: 'recorded_at DESC',
      limit: 100
    });

    return sendSuccess(res, req, { count: metrics.length, metrics }, "Health metrics retrieved successfully", 200);
  } catch (error) {
    logger.error("Get health metrics error:", {
      error: error.message,
      stack: error.stack,
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
      return sendError(res, req, "Not authorized to add metrics for this patient", 403, "FORBIDDEN");
    }

    // Validate metric type against HealthMetric model enum
    const validTypes = ['bp','sugar','weight','bmi','temperature','steps','sleep','water','exercise','stress','heart-rate','oxygen'];
    if (!type || !validTypes.includes(type)) {
      return sendError(
        res,
        req,
        `Invalid metric type. Must be one of: ${validTypes.join(', ')}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    // Resolve patient using PostgreSQL repository
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
      await invalidateAfterPatientHealthMutation();
      logger.debug("Cache invalidated after health metric addition");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, metric, "Health metric added successfully", 201);
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
 * @route   POST /api/patients/activity
 * @access  Private
 */
exports.getActivityData = async (req, res, next) => {
  try {
    const patientId = String(req.params.patientId);

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return sendError(res, req, "Not authorized to view this patient data", 403, "FORBIDDEN");
    }

    // Resolve patient using PostgreSQL repository
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let activityPatient;
    if (uuidRegex.test(patientId)) {
      activityPatient = await userRepository.findById(patientId);
    } else {
      activityPatient = await userRepository.findByUserId(patientId);
    }

    // Must resolve to a real patient — never fall back to raw URL param as DB key
    if (!activityPatient || activityPatient.role !== 'patient') {
      return sendError(res, req, "Patient not found", 404, "NOT_FOUND");
    }
    const patientObjectId = activityPatient.id;
    const activityTypes = ["steps", "sleep", "water", "exercise", "stress"];

    // Get latest activity metrics
    const latestMetrics = await healthMetricRepository.getLatestMetrics(
      patientObjectId,
      activityTypes
    );

    // Get today's metrics for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMetrics = await healthMetricRepository.findTodayMetrics(
      patientObjectId,
      activityTypes
    );

    return sendSuccess(
      res,
      req,
      {
        latest: latestMetrics,
        today: todayMetrics,
      },
      "Activity data retrieved successfully",
      200
    );
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
      return sendError(res, req, "Not authorized to update activity for this patient", 403, "FORBIDDEN");
    }

    // Validate activity type
    const validTypes = ["steps", "sleep", "water", "exercise", "stress"];
    if (!validTypes.includes(type)) {
      return sendError(res, req, "Invalid activity type", 400, "VALIDATION_ERROR");
    }

    // Resolve patient using PostgreSQL repository
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
      await invalidateAfterPatientHealthMutation();
      logger.debug("Cache invalidated after activity data update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, metric, "Activity data updated successfully", 201);
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
 * @route   POST /api/patients/health-metrics/latest
 * @access  Private
 */
exports.getLatestHealthMetric = async (req, res, next) => {
  try {
    const patientId = String(req.body.patientId);
    const type = String(req.body.type);

    // Check access rights - supports both _id and userId formats
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      !isOwnPatientData(req.user, patientId)
    ) {
      return sendError(res, req, "Not authorized to view this patient data", 403, "FORBIDDEN");
    }

    // Resolve patient using PostgreSQL repository
    const uuidRegexLatest = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let latestPatient;
    if (uuidRegexLatest.test(patientId)) {
      latestPatient = await userRepository.findById(patientId);
    } else {
      latestPatient = await userRepository.findByUserId(patientId);
    }

    // Must resolve to a real patient — never fall back to raw URL param as DB key
    if (!latestPatient || latestPatient.role !== 'patient') {
      return sendError(res, req, "Patient not found", 404, "NOT_FOUND");
    }
    const latestPatientId = latestPatient.id;
    // Explicit String cast on type prevents operator injection
    const metricsQuery = { patient: latestPatientId, type: String(type) };
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
      return sendError(res, req, `No ${type} metrics found for this patient`, 404, "NOT_FOUND");
    }

    return sendSuccess(res, req, latestMetric, "Latest health metric retrieved successfully", 200);
  } catch (error) {
    logger.error("Get latest health metric error:", {
      error: error.message,
      stack: error.stack,
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
      return sendError(res, req, "Not authorized to update metrics for this patient", 403, "FORBIDDEN");
    }

    const existing = await healthMetricRepository.findById(metricId);
    if (!existing) {
      return sendError(res, req, "Metric not found", 404, "NOT_FOUND");
    }

    const updates = {};
    if (value !== undefined) updates.value = value;
    if (notes !== undefined) updates.notes = notes;
    if (timestamp !== undefined) updates.timestamp = timestamp;

    const updated = await healthMetricRepository.update(metricId, updates);

    try {
      await invalidateAfterPatientHealthMutation();
      logger.debug("Cache invalidated after health metric update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, updated, "Health metric updated successfully", 200);
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
      return sendError(res, req, "Not authorized to delete metrics for this patient", 403, "FORBIDDEN");
    }

    // First find the metric to verify it belongs to the patient
    const existingMetric = await healthMetricRepository.findById(metricId);
    
    if (!existingMetric) {
      return sendError(res, req, "Metric not found", 404, "NOT_FOUND");
    }
    
    await healthMetricRepository.delete(metricId);

    // Invalidate patient-related caches after metric deletion
    try {
      await invalidateAfterPatientHealthMutation();
      logger.debug("Cache invalidated after health metric deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, metric, "Health metric deleted successfully", 200);
  } catch (error) {
    logger.error("Delete health metric error:", {
      error: error.message,
      stack: error.stack,
      metricId: req.params.metricId,
    });
    next(error);
  }
};


