/**
 * Patient Controller
 * Handles patient management, search, and medical history
 */

const User = require("../models/User");
const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
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
 * @desc    Search patients by name, ID, phone, or email
 * @route   GET /api/patients/search?q=query
 * @access  Private (Doctor/Admin)
 */
exports.searchPatients = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 1 character",
      });
    }

    // Sanitize search query to prevent regex injection
    const searchQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Search in multiple fields
    const patients = await User.find({
      role: "patient",
      $or: [
        { userId: { $regex: searchQuery, $options: "i" } },
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .select(
        "userId name email phone age gender bloodGroup allergies medicalHistory createdAt"
      )
      .limit(20)
      .lean();

    res.json({
      success: true,
      count: patients.length,
      data: patients, // Changed from 'patients' to 'data' for consistency
      patients, // Keep both for backward compatibility
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

    // Get patient profile - try both userId and _id
    const patient = await User.findOne({
      role: "patient",
      $or: [{ userId: patientId }, { _id: patientId }],
    })
      .select("-password")
      .lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Use MongoDB _id for querying related collections
    const patientObjectId = patient._id;

    // Get all medical records (sorted by most recent)
    const medicalRecords = await MedicalRecord.find({
      patientId: patientObjectId,
    })
      .populate("doctorId", "name specialization userId")
      .sort({ createdAt: -1 })
      .lean();

    // Get all appointments (sorted by most recent)
    const appointments = await Appointment.find({ patientId: patientObjectId })
      .populate("doctorId", "name specialization userId")
      .sort({ appointmentDate: -1 })
      .lean();

    // Get all prescriptions (sorted by most recent)
    const prescriptions = await Prescription.find({
      patientId: patientObjectId,
    })
      .populate("doctorId", "name specialization userId")
      .sort({ createdAt: -1 })
      .lean();

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

    const patient = await User.findOne({
      role: "patient",
      $or: [{ userId: patientId }, { _id: patientId }],
    })
      .select("-password")
      .lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Get quick stats using patient._id
    const [recordCount, appointmentCount, prescriptionCount] =
      await Promise.all([
        MedicalRecord.countDocuments({ patientId: patient._id }),
        Appointment.countDocuments({ patientId: patient._id }),
        Prescription.countDocuments({ patientId: patient._id }),
      ]);

    res.json({
      success: true,
      data: {
        ...patient,
        stats: {
          totalRecords: recordCount,
          totalAppointments: appointmentCount,
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

    const allowedUpdates = [
      "name",
      "age",
      "gender",
      "phone",
      "address",
      "bloodGroup",
      "allergies",
      "medicalHistory",
      "emergencyContact",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const patient = await User.findOneAndUpdate(
      { userId: patientId, role: "patient" },
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: patient,
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

    // Fetch all metrics for the patient - handle both _id and userId
    const patient = await User.findOne({
      role: "patient",
      $or: [{ userId: patientId }, { _id: patientId }],
    }).select("_id");

    const patientObjectId = patient ? patient._id : patientId;
    const metrics = await HealthMetric.find({ patient: patientObjectId })
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
    const patient = await User.findOne({
      role: "patient",
      $or: [{ userId: patientId }, { _id: patientId }],
    }).select("_id");

    const patientObjectId = patient ? patient._id : patientId;
    const metric = await HealthMetric.create({
      patient: patientObjectId,
      type,
      value,
      notes,
      timestamp: timestamp || Date.now(),
      recordedBy: req.user._id,
      source: req.user.role === "doctor" ? "doctor" : "manual",
    });

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
    const patient = await User.findOne({
      role: "patient",
      $or: [{ userId: patientId }, { _id: patientId }],
    }).select("_id");

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

    const todayMetrics = await HealthMetric.find({
      patient: patientObjectId,
      type: { $in: activityTypes },
      timestamp: { $gte: today },
    }).lean();

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
    const patient = await User.findOne({
      role: "patient",
      $or: [{ userId: patientId }, { _id: patientId }],
    }).select("_id");

    const patientObjectId = patient ? patient._id : patientId;
    const metric = await HealthMetric.create({
      patient: patientObjectId,
      type,
      value,
      notes,
      recordedBy: req.user._id,
      source: "app",
    });

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
