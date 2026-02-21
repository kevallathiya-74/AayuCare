/**
 * Patient Controller
 * Handles patient management, search, and medical history
 */

const userRepository = require("../repositories/userRepository");
const patientRepository = require("../repositories/patientRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const User = require("../models/User");
const MedicalRecord = require("../models/MedicalRecord");
const HealthMetric = require("../models/HealthMetric");
const logger = require("../utils/logger");

/**
 * Helper to check if the requesting user is the same as the target patient
 * Handles both MongoDB _id and custom userId formats
 * @param {Object} user - The authenticated user (req.user)
 * @param {String} patientId - The patient identifier from request params
 * @returns {Boolean} - True if user is the same patient
 */
const isOwnPatientData = (user, patientId) => {
  // Check against custom userId (e.g., "PAT001")
  if (user.userId === patientId) return true;
  // Check against MongoDB _id (ObjectId as string)
  if (user._id && user._id.toString() === patientId) return true;
  return false;
};

/**
 * @desc    Search patients by name, ID, phone, or email (or get all if no query)
 * @route   GET /api/patients/search?q=query
 * @access  Private (Doctor/Admin)
 */
exports.searchPatients = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: "Failed to search patients",
      error: error.message,
    });
  }
};

/**
 * @desc    Get complete medical history of a patient
 * @route   GET /api/patients/:patientId/complete-history
 * @access  Private (Doctor/Admin or Patient own data)
 */
exports.getCompleteHistory = async (req, res) => {
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

    // Get all medical records (sorted by most recent) - MongoDB collection
    const recordQuery = { patientId: patientDbId };
    if (req.hospitalId && req.user.role !== "super_admin") {
      recordQuery.hospitalId = req.hospitalId;
    }
    const medicalRecords = await MedicalRecord.find(recordQuery)
      .populate("doctorId", "name specialization userId isActive")
      .sort({ createdAt: -1 })
      .lean();

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
        allergies: patient.allergies || [],
        bloodGroup: patient.bloodGroup || "Not specified",
        chronicConditions: patient.medicalHistory || [],
        age: patient.age,
        gender: patient.gender,
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient history",
      error: error.message,
    });
  }
};

/**
 * @desc    Get patient profile with basic info
 * @route   GET /api/patients/:patientId/profile
 * @access  Private (Doctor/Admin or Patient own data)
 */
exports.getPatientProfile = async (req, res) => {
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
        MedicalRecord.countDocuments(statsQuery),
        appointmentRepository.countByStatus(patient.id, "patient", req.hospitalId),
        prescriptionRepository.findByPatient(patient.id, {}).then(p => p.length),
      ]);

    res.json({
      success: true,
      data: {
        ...patient,
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient profile",
      error: error.message,
    });
  }
};

/**
 * @desc    Update patient profile
 * @route   PATCH /api/patients/:patientId/profile
 * @access  Private (Patient own data or Admin)
 */
exports.updatePatientProfile = async (req, res) => {
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
        relation: null,
      },
      allergies: refreshedPatientProfile?.allergies || [],
      chronicConditions: refreshedPatientProfile?.chronic_conditions || [],
      medicalHistory: refreshedPatientProfile?.chronic_conditions || [],
    };

    // Invalidate relevant caches after patient profile update
    const { deleteCacheByPattern } = require("../config/redis");
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
    res.status(500).json({
      success: false,
      message: "Failed to update patient profile",
      error: error.message,
    });
  }
};

/**
 * @desc    Get health metrics for a patient
 * @route   GET /api/patients/:patientId/health-metrics
 * @access  Private (Patient own data, Doctor, or Admin)
 */
exports.getHealthMetrics = async (req, res) => {
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
    
    const metrics = await HealthMetric.find(metricsQuery)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

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
    res.status(500).json({
      success: false,
      message: "Failed to fetch health metrics",
      error: error.message,
    });
  }
};

/**
 * @desc    Add health metric
 * @route   POST /api/patients/:patientId/health-metrics
 * @access  Private
 */
exports.addHealthMetric = async (req, res) => {
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

    // Get patient ObjectId for storing metric
    const query = { role: "patient" };
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ userId: patientId }, { _id: patientId }];
    } else {
      query.userId = patientId;
    }
    const patient = await User.findOne(query).select("_id");

    const patientObjectId = patient ? patient._id : patientId;
    const metric = await HealthMetric.create({
      patient: patientObjectId,
      hospitalId: req.hospitalId || req.user.hospitalId || "MAIN",
      type,
      value,
      notes,
      timestamp: timestamp || Date.now(),
      recordedBy: req.user._id,
      source: req.user.role === "doctor" ? "doctor" : "manual",
    });

    // Invalidate patient-related caches after adding health metric
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:health:*");
      await deleteCacheByPattern("cache:health:*");
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
    res.status(500).json({
      success: false,
      message: "Failed to add health metric",
      error: error.message,
    });
  }
};

/**
 * @desc    Get activity tracking data (steps, sleep, water, stress)
 * @route   GET /api/patients/:patientId/activity
 * @access  Private
 */
exports.getActivityData = async (req, res) => {
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

    // Get patient ObjectId for querying metrics
    const query = { role: "patient" };
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ userId: patientId }, { _id: patientId }];
    } else {
      query.userId = patientId;
    }
    const patient = await User.findOne(query).select("_id");

    const patientObjectId = patient ? patient._id : patientId;
    const activityTypes = ["steps", "sleep", "water", "exercise", "stress"];

    // Get latest activity metrics
    const latestMetrics = await HealthMetric.getLatestMetrics(
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
    
    const todayMetrics = await HealthMetric.find(todayMetricsQuery).lean();

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
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity data",
      error: error.message,
    });
  }
};

/**
 * @desc    Update activity data (steps, water, etc.)
 * @route   POST /api/patients/:patientId/activity
 * @access  Private
 */
exports.updateActivityData = async (req, res) => {
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

    // Get patient ObjectId for storing metric
    const query = { role: "patient" };
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ userId: patientId }, { _id: patientId }];
    } else {
      query.userId = patientId;
    }
    const patient = await User.findOne(query).select("_id");

    const patientObjectId = patient ? patient._id : patientId;
    const metric = await HealthMetric.create({
      patient: patientObjectId,
      hospitalId: req.hospitalId || req.user.hospitalId || "MAIN",
      type,
      value,
      notes,
      recordedBy: req.user._id,
      source: "app",
    });

    // Invalidate patient-related caches after activity update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:health:*");
      await deleteCacheByPattern("cache:health:*");
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
    res.status(500).json({
      success: false,
      message: "Failed to update activity data",
      error: error.message,
    });
  }
};
/**
 * @desc    Get latest health metric by type
 * @route   GET /api/patients/:patientId/health-metrics/latest/:type
 * @access  Private
 */
exports.getLatestHealthMetric = async (req, res) => {
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

    // Get patient ObjectId
    const query = { role: "patient" };
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ userId: patientId }, { _id: patientId }];
    } else {
      query.userId = patientId;
    }
    const patient = await User.findOne(query).select("_id");

    const patientObjectId = patient ? patient._id : patientId;
    const metricsQuery = { patient: patientObjectId, type };
    if (req.hospitalId && req.user.role !== "super_admin") {
      metricsQuery.hospitalId = req.hospitalId;
    }
    
    const latestMetric = await HealthMetric.findOne(metricsQuery)
      .sort({ timestamp: -1 })
      .lean();

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
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest health metric",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete health metric
 * @route   DELETE /api/patients/:patientId/health-metrics/:metricId
 * @access  Private (Patient own data or Admin)
 */
exports.deleteHealthMetric = async (req, res) => {
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

    // Get patient ObjectId
    const query = { role: "patient" };
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ userId: patientId }, { _id: patientId }];
    } else {
      query.userId = patientId;
    }
    const patient = await User.findOne(query).select("_id");

    const patientObjectId = patient ? patient._id : patientId;
    
    const metric = await HealthMetric.findOneAndDelete({
      _id: metricId,
      patient: patientObjectId,
    });

    if (!metric) {
      return res.status(404).json({
        success: false,
        message: "Metric not found",
      });
    }

    // Invalidate patient-related caches after metric deletion
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:health:*");
      await deleteCacheByPattern("cache:health:*");
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
    res.status(500).json({
      success: false,
      message: "Failed to delete health metric",
      error: error.message,
    });
  }
};