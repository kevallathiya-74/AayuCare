/**
 * Prescription Controller
 * Handles prescription creation, retrieval, and management
 * Fully refactored to use repository pattern
 */

const prescriptionRepository = require("../repositories/prescriptionRepository");
const userRepository = require("../repositories/userRepository");
const Prescription = require("../models/Prescription");
const logger = require("../utils/logger");

const resolveUserByIdentifier = async (identifier) => {
  const value = String(identifier || "").trim();
  if (!value) return null;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  if (isUuid) {
    return userRepository.findById(value);
  }

  return userRepository.findByUserId(value);
};

const enrichPrescriptionUsers = async (prescriptions = []) => {
  if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
    return [];
  }

  const userIds = [
    ...new Set(
      prescriptions
        .flatMap((entry) => [entry.patientId, entry.doctorId])
        .filter(Boolean)
    ),
  ];

  const users = await Promise.all(userIds.map((id) => userRepository.findById(id)));
  const userMap = new Map(users.filter(Boolean).map((user) => [user.id, user]));

  return prescriptions.map((entry) => ({
    ...entry,
    patientName: userMap.get(entry.patientId)?.name || "Unknown Patient",
    patientUserId: userMap.get(entry.patientId)?.user_id || null,
    doctorName: userMap.get(entry.doctorId)?.name || "Unknown Doctor",
    doctorUserId: userMap.get(entry.doctorId)?.user_id || null,
  }));
};

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
      appointmentId,
      medications,
      medicines,
      diagnosis,
      instructions,
      followUpDate,
      sendOptions,
    } = req.body;

    const doctorId = req.user.id || req.user._id;
    const meds = medications || medicines || [];

    // Validate required fields
    if (!patientId || !Array.isArray(meds) || meds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and at least one medication are required",
      });
    }

    // Verify patient exists using repository (uuid or custom userId)
    const patient = await resolveUserByIdentifier(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Invalid doctor session",
      });
    }

    const normalizedMedicines = meds.map((medication) => ({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration: medication.duration,
      instructions: medication.instructions || "",
      price: medication.price || medication.unitPrice || null,
    }));

    // Create prescription using repository
    const prescription = await prescriptionRepository.create({
      patientId: patient.id,
      doctorId,
      appointmentId: appointmentId || null,
      hospitalId: req.hospitalId || req.user.hospitalId || req.user.hospital_id || "MAIN",
      medicines: normalizedMedicines,
      diagnosis,
      instructions,
      followUpDate,
      isSentToPatient: !!sendOptions?.patientApp,
      sentToPatientAt: sendOptions?.patientApp ? new Date() : null,
      pharmacyStatus:
        sendOptions?.hospitalPharmacy || sendOptions?.externalPharmacy
          ? "sent_to_pharmacy"
          : "pending",
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

    const patient = await resolveUserByIdentifier(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check access rights
    const isOwnData = req.user.id === patient.id || req.user.userId === patient.user_id;
    if (req.user.role !== "admin" && req.user.role !== "doctor" && !isOwnData) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these prescriptions",
      });
    }

    const prescriptions = await prescriptionRepository.findByPatient(patient.id, {
      hospitalId: req.hospitalId && req.user.role !== "super_admin" ? req.hospitalId : undefined,
      limit: parseInt(req.query.limit || 50),
      skip: parseInt(req.query.skip || 0),
    });

    const enriched = await enrichPrescriptionUsers(prescriptions);

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
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

    const doctor = await resolveUserByIdentifier(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Check access rights
    const isOwnData = req.user.id === doctor.id || req.user.userId === doctor.user_id;
    if (req.user.role !== "admin" && !isOwnData) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these prescriptions",
      });
    }

    const prescriptions = await prescriptionRepository.findByDoctor(doctor.id, {
      hospitalId: req.hospitalId && req.user.role !== "super_admin" ? req.hospitalId : undefined,
      limit: parseInt(req.query.limit || 50),
      skip: parseInt(req.query.skip || 0),
    });

    const enriched = await enrichPrescriptionUsers(prescriptions);

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
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

    const prescription = await prescriptionRepository.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Check access rights
    const isPatientOwner =
      prescription.patientId &&
      (req.user.id === prescription.patientId || req.user.userId === prescription.patientId);
    const isDoctorOwner =
      prescription.doctorId &&
      (req.user.id === prescription.doctorId || req.user.userId === prescription.doctorId);

    if (req.user.role !== "admin" && !isDoctorOwner && !isPatientOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this prescription",
      });
    }

    const enriched = (await enrichPrescriptionUsers([prescription]))[0] || prescription;

    res.json({
      success: true,
      data: enriched,
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
