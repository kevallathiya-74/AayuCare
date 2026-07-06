/**
 * Prescription Controller
 * Handles prescription creation, retrieval, and management
 * Fully refactored to use repository pattern
 */

const prescriptionRepository = require("./prescription.repository");
const userRepository = require("../auth/user.repository");
const logger = require("../../utils/logger");
const { invalidateAfterPrescriptionMutation } = require("../../utils/cacheInvalidation");
const { writeAuditLog, AUDIT_ACTIONS } = require("../../utils/audit");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const PHARMACY_STATUS_ALIASES = {
  sent_to_pharmacy: "preparing",
  processing: "preparing",
};

const VALID_PHARMACY_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "dispensed",
  "cancelled",
];

const normalizePharmacyStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return PHARMACY_STATUS_ALIASES[normalized] || normalized;
};

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

  const users = await userRepository.findByIds(userIds);
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
exports.getAllPrescriptions = async (req, res, next) => {
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

    // Enrich with patient and doctor names via batch lookup
    const prescriptionsWithNames = await enrichPrescriptionUsers(prescriptions);

    return sendSuccess(
      res,
      req,
      {
        count: prescriptions.length,
        prescriptions: prescriptionsWithNames,
      },
      "Prescriptions retrieved successfully",
      200
    );
  } catch (error) {
    logger.error("Error fetching all prescriptions:", error);
    next(error);
  }
};

/**
 * @desc    Create a new prescription - Uses Repository
 * @route   POST /api/prescriptions
 * @access  Private (Doctor/Admin)
 */
exports.createPrescription = async (req, res, next) => {
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

    const doctorId = req.user.id;
    const meds = medications || medicines || [];

    // Guard: doctor session must be valid
    if (!doctorId) {
      return sendError(res, req, "Invalid doctor session", 401, "UNAUTHORIZED");
    }

    // Validate required fields
    if (!patientId || !Array.isArray(meds) || meds.length === 0) {
      return sendError(
        res,
        req,
        "Patient ID and at least one medication are required",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Verify patient exists using repository (uuid or custom userId)
    const patient = await resolveUserByIdentifier(patientId);
    if (!patient || patient.role !== "patient") {
      return sendError(res, req, "Patient not found", 404, "NOT_FOUND");
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
          ? "preparing"
          : "pending",
    });

    // Invalidate relevant caches after prescription creation
    try {
      await invalidateAfterPrescriptionMutation();
      logger.debug("Cache invalidated after prescription creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.PRESCRIPTION_CREATE,
      entityType: "prescription",
      entityId: prescription.id,
      newValues: { patientId: patient.id, doctorId, medicationsCount: normalizedMedicines.length },
      req,
    });

    return sendSuccess(
      res,
      req,
      prescription,
      "Prescription created successfully. Patient will be notified.",
      201
    );
  } catch (error) {
    logger.error("Create prescription error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.body.patientId,
    });
    next(error);
  }
};

/**
 * @desc    Get all prescriptions for a patient
 * @route   GET /api/prescriptions/patient/:patientId
 * @access  Private (Patient own data or Doctor/Admin)
 */
exports.getPatientPrescriptions = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await resolveUserByIdentifier(patientId);
    if (!patient || patient.role !== "patient") {
      return sendError(res, req, "Patient not found", 404, "NOT_FOUND");
    }

    // Check access rights
    const isOwnData = req.user.id === patient.id || req.user.userId === patient.user_id;
    if (req.user.role !== "admin" && req.user.role !== "doctor" && !isOwnData) {
      return sendError(res, req, "Not authorized to view these prescriptions", 403, "FORBIDDEN");
    }

    const prescriptions = await prescriptionRepository.findByPatientId(patient.id, {
      hospitalId: req.hospitalId && req.user.role !== "super_admin" ? req.hospitalId : undefined,
      limit: Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 100),
      skip: Math.max(parseInt(String(req.query.skip  || '0'),  10) || 0,  0),
    });

    const enriched = await enrichPrescriptionUsers(prescriptions);

    return sendSuccess(
      res,
      req,
      {
        count: enriched.length,
        prescriptions: enriched,
      },
      "Patient prescriptions retrieved successfully",
      200
    );
  } catch (error) {
    logger.error("Get patient prescriptions error:", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get all prescriptions created by a doctor
 * @route   GET /api/prescriptions/doctor/:doctorId
 * @access  Private (Doctor own data or Admin)
 */
exports.getDoctorPrescriptions = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await resolveUserByIdentifier(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return sendError(res, req, "Doctor not found", 404, "NOT_FOUND");
    }

    // Check access rights
    const isOwnData = req.user.id === doctor.id || req.user.userId === doctor.user_id;
    if (req.user.role !== "admin" && !isOwnData) {
      return sendError(res, req, "Not authorized to view these prescriptions", 403, "FORBIDDEN");
    }

    const prescriptions = await prescriptionRepository.findByDoctorId(doctor.id, {
      hospitalId: req.hospitalId && req.user.role !== "super_admin" ? req.hospitalId : undefined,
      limit: Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 100),
      skip: Math.max(parseInt(String(req.query.skip  || '0'),  10) || 0,  0),
    });

    const enriched = await enrichPrescriptionUsers(prescriptions);

    return sendSuccess(
      res,
      req,
      {
        count: enriched.length,
        prescriptions: enriched,
      },
      "Doctor prescriptions retrieved successfully",
      200
    );
  } catch (error) {
    logger.error("Get doctor prescriptions error:", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get prescription by ID
 * @route   GET /api/prescriptions/:prescriptionId
 * @access  Private
 */
exports.getPrescriptionById = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await prescriptionRepository.findById(prescriptionId);

    if (!prescription) {
      return sendError(res, req, "Prescription not found", 404, "NOT_FOUND");
    }

    // Check access rights â€” compare UUIDs only (patientId stored as UUID in Prescription)
    const isPatientOwner =
      prescription.patientId &&
      req.user.id === prescription.patientId;
    const isDoctorOwner =
      prescription.doctorId &&
      req.user.id === prescription.doctorId;

    if (req.user.role !== "admin" && !isDoctorOwner && !isPatientOwner) {
      return sendError(res, req, "Not authorized to view this prescription", 403, "FORBIDDEN");
    }

    const enriched = (await enrichPrescriptionUsers([prescription]))[0] || prescription;

    return sendSuccess(res, req, enriched, "Prescription retrieved successfully", 200);
  } catch (error) {
    logger.error("Get prescription by ID error:", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Update prescription status
 * @route   PATCH /api/prescriptions/:prescriptionId/status
 * @access  Private (Doctor/Admin)
 */
exports.updatePrescriptionStatus = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const pharmacyStatus = normalizePharmacyStatus(
      req.body.pharmacyStatus || req.body.status
    );

    if (!pharmacyStatus || !VALID_PHARMACY_STATUSES.includes(pharmacyStatus)) {
      return sendError(
        res,
        req,
        `Invalid status. Must be one of: ${VALID_PHARMACY_STATUSES.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const prescription = await prescriptionRepository.updatePharmacyStatus(
      prescriptionId,
      pharmacyStatus
    );

    if (!prescription) {
      return sendError(res, req, "Prescription not found", 404, "NOT_FOUND");
    }

    // Invalidate relevant caches after prescription status update
    try {
      await invalidateAfterPrescriptionMutation();
      logger.debug("Cache invalidated after prescription status update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, prescription, "Prescription status updated successfully", 200);
  } catch (error) {
    logger.error("Update prescription status error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
      status: req.body.status,
    });
    next(error);
  }
};

/**
 * @desc    Update pharmacy status
 * @route   PATCH /api/prescriptions/:prescriptionId
 * @access  Private (Doctor/Admin)
 */
exports.updatePharmacyStatus = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const pharmacyStatus = normalizePharmacyStatus(req.body.pharmacyStatus);

    if (!pharmacyStatus || !VALID_PHARMACY_STATUSES.includes(pharmacyStatus)) {
      return sendError(
        res,
        req,
        `Invalid pharmacy status. Must be one of: ${VALID_PHARMACY_STATUSES.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    // Update using repository
    const prescription = await prescriptionRepository.updatePharmacyStatus(
      prescriptionId,
      pharmacyStatus
    );

    if (!prescription) {
      return sendError(res, req, "Prescription not found", 404, "NOT_FOUND");
    }

    // Invalidate relevant caches
    try {
      await invalidateAfterPrescriptionMutation();
      logger.debug("Cache invalidated after pharmacy status update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, prescription, "Pharmacy status updated successfully", 200);
  } catch (error) {
    logger.error("Update pharmacy status error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
      pharmacyStatus: req.body.pharmacyStatus,
    });
    next(error);
  }
};

/**
 * @desc    Get pharmacy dashboard stats
 * @route   GET /api/prescriptions/pharmacy/stats
 * @access  Private (Admin)
 */
exports.getPharmacyStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const hospitalId = req.hospitalId && req.user.role !== "super_admin" ? req.hospitalId : undefined;

    const stats = await prescriptionRepository.getPharmacyStatusCounts({
      hospitalId,
      startDate,
      endDate,
    });

    return sendSuccess(res, req, stats, "Pharmacy stats retrieved successfully", 200);
  } catch (error) {
    logger.error("Get pharmacy stats error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    next(error);
  }
};

/**
 * @desc    Delete a prescription
 * @route   DELETE /api/prescriptions/:prescriptionId
 * @access  Private (Admin only)
 */
exports.deletePrescription = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await prescriptionRepository.delete(prescriptionId);

    if (!prescription) {
      return sendError(res, req, "Prescription not found", 404, "NOT_FOUND");
    }

    // Invalidate relevant caches after prescription deletion
    try {
      await invalidateAfterPrescriptionMutation();
      logger.debug("Cache invalidated after prescription deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return sendSuccess(res, req, null, "Prescription deleted successfully", 200);
  } catch (error) {
    logger.error("Delete prescription error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
    });
    next(error);
  }
};



