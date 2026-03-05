const medicalRecordRepository = require("../repositories/medicalRecordRepository");
const userRepository = require("../repositories/userRepository");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const { deleteCacheByPattern } = require("../config/redis");
const { writeAuditLog, AUDIT_ACTIONS } = require("../utils/audit");

// Shared UUID regex — used to decide findById vs findByUserId
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * @desc    Get all medical records (admin only with filters)
 * @route   GET /api/medical-records
 * @access  Private (Admin)
 */
exports.getAllMedicalRecords = async (req, res, next) => {
  try {
    const {
      patientId,
      doctorId,
      recordType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate recordType against allowed enum
    const VALID_RECORD_TYPES = ['lab_report', 'prescription', 'doctor_visit', 'test_result', 'imaging', 'vaccination', 'other'];
    if (recordType && !VALID_RECORD_TYPES.includes(String(recordType))) {
      return next(new AppError(`Invalid record type. Must be one of: ${VALID_RECORD_TYPES.join(', ')}`, 400));
    }
    // Validate UUID-format IDs if provided
    const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (patientId && !UUID_RE.test(String(patientId))) {
      return next(new AppError('Invalid patient ID format', 400));
    }
    if (doctorId && !UUID_RE.test(String(doctorId))) {
      return next(new AppError('Invalid doctor ID format', 400));
    }

    // Build query
    const query = {};

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      query.hospitalId = req.hospitalId;
    }

    if (patientId) {
      query.patientId = patientId;
    }

    if (doctorId) {
      query.doctorId = doctorId;
    }

    if (recordType) {
      query.recordType = recordType;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    const options = {
      sort: { date: -1 },
      offset: skip,
      limit: parseInt(limit),
    };

    const medicalRecords = await medicalRecordRepository.findWithFilters(query, options);

    const total = await medicalRecordRepository.count(query);

    res.status(200).json({
      status: "success",
      data: {
        medicalRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new medical record
 * @route   POST /api/medical-records
 * @access  Private (Doctor)
 */
exports.createMedicalRecord = async (req, res, next) => {
  try {
    const {
      patientId,
      recordType,
      title,
      description,
      date,
      diagnosis,
      symptoms,
      medications,
      labResults,
      files,
    } = req.body;

    // Find patient by UUID or custom userId (e.g. "PAT001")
    let patient;
    if (UUID_REGEX.test(patientId)) {
      patient = await userRepository.findById(patientId);
    } else {
      // It's a custom userId string like "PAT001"
      patient = await userRepository.findByUserId(patientId);
    }
    // Verify it's actually a patient
    if (patient && patient.role !== "patient") {
      patient = null;
    }

    if (!patient) {
      return next(new AppError("Patient not found", 404));
    }

    const hospitalId = req.hospitalId || req.user?.hospitalId;
    if (!hospitalId && req.user?.role !== "super_admin") {
      return next(new AppError("Hospital context required to create medical record", 400));
    }

    const medicalRecord = await medicalRecordRepository.create({
      patientId: patient.id, // Use id from found patient
      doctorId: req.user.id,
      hospitalId,
      recordType,
      title,
      description,
      date: date || Date.now(),
      diagnosis,
      symptoms,
      medications,
      labResults,
      files,
    });

    logger.info(
      `Medical record created by ${req.user.userId} for patient ${patient.userId}`
    );

    // Invalidate relevant caches after medical record creation
    try {
      await deleteCacheByPattern("v1:cache:medicalrecord:*");
      await deleteCacheByPattern("cache:medicalrecord:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after medical record creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.MEDICAL_RECORD_CREATE,
      entityType: "medicalRecord",
      entityId: medicalRecord._id ? String(medicalRecord._id) : null,
      newValues: { patientId: patient.id, recordType, title },
      req,
    });

    res.status(201).json({
      status: "success",
      message: "Medical record created successfully",
      data: {
        medicalRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all medical records for a patient
 * @route   GET /api/medical-records/patient/:patientId
 * @access  Private (Patient own data, Doctor, Admin)
 */
exports.getPatientMedicalRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { recordType, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Validate recordType against allowed enum
    const VALID_RECORD_TYPES = ['lab_report', 'prescription', 'doctor_visit', 'test_result', 'imaging', 'vaccination', 'other'];
    if (recordType && !VALID_RECORD_TYPES.includes(String(recordType))) {
      return next(new AppError(`Invalid record type. Must be one of: ${VALID_RECORD_TYPES.join(', ')}`, 400));
    }

    // Check authorization - allow patient to view own data, doctors and admins can view any
    const isOwnData = req.user.userId === patientId;
    if (req.user.role !== "admin" && req.user.role !== "doctor" && !isOwnData) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to view these medical records",
      });
    }

    // Find patient by UUID or custom userId (e.g. "PAT001")
    let patient;
    if (UUID_REGEX.test(patientId)) {
      patient = await userRepository.findById(patientId);
      if (patient && patient.role !== "patient") {
        patient = null;
      }
    } else {
      patient = await userRepository.findByUserId(patientId);
      if (patient && patient.role !== "patient") {
        patient = null;
      }
    }
    if (!patient) {
      return res.status(404).json({
        status: "error",
        message: "Patient not found",
      });
    }

    // Build query
    const query = { patientId: patient.id };

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      query.hospitalId = req.hospitalId;
    }

    if (recordType) {
      query.recordType = recordType;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    const options = {
      sort: { date: -1 },
      offset: skip,
      limit: parseInt(limit),
    };

    const medicalRecords = await medicalRecordRepository.findWithFilters(query, options);

    const total = await medicalRecordRepository.count(query);

    res.status(200).json({
      status: "success",
      data: {
        medicalRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single medical record
 * @route   GET /api/medical-records/:id
 * @access  Private
 */
exports.getMedicalRecord = async (req, res, next) => {
  try {
    const medicalRecord = await medicalRecordRepository.findById(req.params.id);

    if (!medicalRecord) {
      return next(new AppError("Medical record not found", 404));
    }

    // Authorization: patient can only see own records; doctor/admin must belong to same hospital
    const role = req.user.role;
    if (role === "patient") {
      if (medicalRecord.patientId !== req.user.id) {
        return next(new AppError("Not authorized to view this record", 403));
      }
    } else if (role !== "super_admin") {
      // Doctor or admin — must be same hospital as the record
      if (req.hospitalId && medicalRecord.hospitalId && medicalRecord.hospitalId !== req.hospitalId) {
        return next(new AppError("Not authorized to view this record", 403));
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        medicalRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update medical record
 * @route   PUT /api/medical-records/:id
 * @access  Private (Doctor)
 */
exports.updateMedicalRecord = async (req, res, next) => {
  try {
    const medicalRecord = await medicalRecordRepository.findById(req.params.id);

    if (!medicalRecord) {
      return next(new AppError("Medical record not found", 404));
    }

    // Only the doctor who created it can update
    if (
      medicalRecord.doctorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized to update this record", 403));
    }

    const updatedRecord = await medicalRecordRepository.update(
      req.params.id,
      req.body
    );

    logger.info(
      `Medical record ${req.params.id} updated by ${req.user.userId}`
    );

    // Invalidate relevant caches after medical record update
    try {
      await deleteCacheByPattern("v1:cache:medicalrecord:*");
      await deleteCacheByPattern("cache:medicalrecord:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after medical record update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(200).json({
      status: "success",
      data: {
        medicalRecord: updatedRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete medical record
 * @route   DELETE /api/medical-records/:id
 * @access  Private (Doctor, Admin)
 */
exports.deleteMedicalRecord = async (req, res, next) => {
  try {
    const medicalRecord = await medicalRecordRepository.findById(req.params.id);

    if (!medicalRecord) {
      return next(new AppError("Medical record not found", 404));
    }

    // Only the doctor who created it (UUID comparison) or admin can delete
    if (
      medicalRecord.doctorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized to delete this record", 403));
    }

    await medicalRecordRepository.delete(req.params.id);

    logger.info(
      `Medical record ${req.params.id} deleted by ${req.user.userId}`
    );

    // Invalidate relevant caches after medical record deletion
    try {
      await deleteCacheByPattern("v1:cache:medicalrecord:*");
      await deleteCacheByPattern("cache:medicalrecord:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after medical record deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(200).json({
      status: "success",
      message: "Medical record deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get patient's complete medical history
 * @route   GET /api/medical-records/history/:patientId
 * @access  Private (Doctor, Admin)
 */
exports.getPatientHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    // Explicit String cast to prevent type confusion from HPP attacks
    const safePatientId = String(patientId);

    // Find patient by UUID or custom userId
    let patient;
    if (UUID_REGEX.test(safePatientId)) {
      patient = await userRepository.findById(safePatientId);
    } else {
      patient = await userRepository.findByUserId(safePatientId);
    }
    
    // Verify it's actually a patient
    if (!patient || patient.role !== "patient") {
      return next(new AppError("Patient not found", 404));
    }

    const historyQuery = { patientId: patient.id };
    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      historyQuery.hospitalId = req.hospitalId;
    }
    
    const historyOptions = {
      sort: { date: -1 },
      limit: 200,
    };
    
    const medicalRecords = await medicalRecordRepository.findWithFilters(historyQuery, historyOptions);

    // Group by record type
    const history = {
      patient: {
        name: patient.name,
        userId: patient.userId,
        dateOfBirth: patient.dateOfBirth,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        medicalHistory: patient.medicalHistory,
      },
      records: {
        labReports: medicalRecords.filter((r) => r.recordType === "lab_report"),
        prescriptions: medicalRecords.filter(
          (r) => r.recordType === "prescription"
        ),
        doctorVisits: medicalRecords.filter(
          (r) => r.recordType === "doctor_visit"
        ),
        testResults: medicalRecords.filter(
          (r) => r.recordType === "test_result"
        ),
        imaging: medicalRecords.filter((r) => r.recordType === "imaging"),
      },
      totalRecords: medicalRecords.length,
    };

    res.status(200).json({
      status: "success",
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
