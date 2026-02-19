/**
 * Prescription Controller
 * Handles prescription creation, retrieval, and management
 * Fully refactored to use repository pattern
 */

const prescriptionRepository = require("../repositories/prescriptionRepository");
const userRepository = require("../repositories/userRepository");
const User = require("../models/User");
const Prescription = require("../models/Prescription");
const logger = require("../utils/logger");

/**
 * @desc    Get all prescriptions (admin only)
 * @route   GET /api/prescriptions
 * @access  Private (Admin)
 */
exports.getAllPrescriptions = async (req, res) => {
  try {
    const { limit = 50, skip = 0, pharmacyStatus, startDate, endDate } = req.query;

    // Get prescriptions from repository
    const prescriptions = await prescriptionRepository.findAll({
      limit: parseInt(limit),
      skip: parseInt(skip),
      pharmacyStatus,
      startDate,
      endDate,
    });

    // Map to include patient and doctor names from populated data
    const prescriptionsWithNames = prescriptions.map((prescription) => ({
      ...prescription,
      patientName: prescription.patientId?.name || "Unknown Patient",
      doctorName: prescription.doctorId?.name || "Unknown Doctor",
    }));

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions: prescriptionsWithNames,
    });
  } catch (error) {
    logger.error("Error fetching all prescriptions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new prescription - Uses MongoDB via repository
 * @route   POST /api/prescriptions
 * @access  Private (Doctor/Admin)
 */
exports.createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      medications,
      diagnosis,
      symptoms,
      notes,
      followUpDate,
      tests,
    } = req.body;

    // Validate required fields
    if (!patientId || !medications || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and at least one medication are required",
      });
    }

    // Verify patient exists using repository
    const patient = await userRepository.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Create prescription using repository
    const prescription = await prescriptionRepository.create({
      patientId: patient.user_id,
      doctorId: req.user.userId,
      hospitalId: req.hospitalId || req.user.hospitalId || req.user.hospital_id || "MAIN",
      medicines: medications,
      diagnosis,
      instructions: notes,
      followUpDate,
    });

    // Invalidate relevant caches after prescription creation
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:prescription:*");
      await deleteCacheByPattern("cache:prescription:*");
      logger.debug("Cache invalidated after prescription creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(201).json({
      success: true,
      message: "Prescription created successfully. Patient will be notified.",
      data: prescription,
    });
  } catch (error) {
    logger.error("Create prescription error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.body.patientId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to create prescription",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all prescriptions for a patient
 * @route   GET /api/prescriptions/patient/:patientId
 * @access  Private (Patient own data or Doctor/Admin)
 */
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check access rights
    const isOwnData = req.user.userId === patientId;
    if (req.user.role !== "admin" && req.user.role !== "doctor" && !isOwnData) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these prescriptions",
      });
    }

    // Find patient by either userId or _id
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      // Try finding by ObjectId first
      patient = await User.findById(patientId).select("_id role");
      // Verify it's actually a patient
      if (patient && patient.role !== "patient") {
        patient = null;
      }
      // If not found or wrong role, try userId
      if (!patient) {
        patient = await User.findOne({ userId: patientId, role: "patient" }).select("_id");
      }
    } else {
      patient = await User.findOne({ userId: patientId, role: "patient" }).select("_id");
    }
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const prescriptionQuery = { patientId: patient._id };
    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      prescriptionQuery.hospitalId = req.hospitalId;
    }
    
    const prescriptions = await Prescription.find(prescriptionQuery)
      .populate("doctorId", "name specialization userId isActive")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    logger.error("Get patient prescriptions error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.params.patientId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all prescriptions created by a doctor
 * @route   GET /api/prescriptions/doctor/:doctorId
 * @access  Private (Doctor own data or Admin)
 */
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Check access rights
    const isOwnData = req.user.userId === doctorId;
    if (req.user.role !== "admin" && !isOwnData) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these prescriptions",
      });
    }

    // Find doctor by either userId or _id
    const doctor = await User.findOne({
      role: "doctor",
      $or: [{ userId: doctorId }, { _id: doctorId }],
    }).select("_id");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const prescriptionQuery = { doctorId: doctor._id };
    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      prescriptionQuery.hospitalId = req.hospitalId;
    }
    
    const prescriptions = await Prescription.find(prescriptionQuery)
      .populate("patientId", "name userId age gender isActive dateOfBirth bloodGroup address")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    logger.error("Get doctor prescriptions error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.params.doctorId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
};

/**
 * @desc    Get prescription by ID
 * @route   GET /api/prescriptions/:prescriptionId
 * @access  Private
 */
exports.getPrescriptionById = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("doctorId", "name specialization userId phone isActive")
      .populate("patientId", "name userId age gender bloodGroup isActive dateOfBirth address");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Check access rights - handle both populated and string patientId/doctorId
    const patientUserId =
      typeof prescription.patientId === "string"
        ? prescription.patientId
        : prescription.patientId?.userId;
    const doctorUserId =
      typeof prescription.doctorId === "string"
        ? prescription.doctorId
        : prescription.doctorId?.userId;

    const isPatientOwner = patientUserId && req.user.userId === patientUserId;
    const isDoctorOwner = doctorUserId && req.user.userId === doctorUserId;

    if (req.user.role !== "admin" && !isDoctorOwner && !isPatientOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this prescription",
      });
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    logger.error("Get prescription by ID error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescription",
      error: error.message,
    });
  }
};

/**
 * @desc    Update prescription status
 * @route   PATCH /api/prescriptions/:prescriptionId/status
 * @access  Private (Doctor/Admin)
 */
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be active, completed, or cancelled",
      });
    }

    const prescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      { status },
      { new: true, runValidators: true }
    ).populate("doctorId", "name specialization isActive");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Invalidate relevant caches after prescription status update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:prescription:*");
      await deleteCacheByPattern("cache:prescription:*");
      logger.debug("Cache invalidated after prescription status update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: "Prescription status updated successfully",
      data: prescription,
    });
  } catch (error) {
    logger.error("Update prescription status error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
      status: req.body.status,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update prescription status",
      error: error.message,
    });
  }
};

/**
 * @desc    Update pharmacy status
 * @route   PATCH /api/prescriptions/:prescriptionId
 * @access  Private (Doctor/Admin)
 */
exports.updatePharmacyStatus = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { pharmacyStatus } = req.body;

    const validStatuses = [
      "pending",
      "sent_to_pharmacy",
      "preparing",
      "ready",
      "dispensed",
    ];

    if (!pharmacyStatus || !validStatuses.includes(pharmacyStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid pharmacy status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Update using repository
    const prescription = await prescriptionRepository.updatePharmacyStatus(
      prescriptionId,
      pharmacyStatus
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Invalidate relevant caches
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:prescription:*");
      await deleteCacheByPattern("cache:prescription:*");
      logger.debug("Cache invalidated after pharmacy status update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: "Pharmacy status updated successfully",
      data: prescription,
    });
  } catch (error) {
    logger.error("Update pharmacy status error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
      pharmacyStatus: req.body.pharmacyStatus,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update pharmacy status",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a prescription
 * @route   DELETE /api/prescriptions/:prescriptionId
 * @access  Private (Admin only)
 */
exports.deletePrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findByIdAndDelete(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Invalidate relevant caches after prescription deletion
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:prescription:*");
      await deleteCacheByPattern("cache:prescription:*");
      logger.debug("Cache invalidated after prescription deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    logger.error("Delete prescription error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete prescription",
      error: error.message,
    });
  }
};
