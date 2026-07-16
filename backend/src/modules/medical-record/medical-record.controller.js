const medicalRecordRepository = require("./medical-record.repository");
const userRepository = require("../auth/user.repository");
const { AppError } = require("../../middleware/errorHandler");
const logger = require("../../utils/logger");
const { invalidateByPatterns, MEDICAL_RECORD_CACHE_PATTERNS } = require('../../utils/cacheInvalidation');
const { writeAuditLog, AUDIT_ACTIONS } = require("../../utils/audit");

// Shared UUID regex — used to decide findById vs findByUserId
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const VALID_RECORD_TYPES = [
  "lab_report",
  "prescription",
  "doctor_visit",
  "test_result",
  "imaging",
  "vaccination",
  "other",
];
const RECORD_TYPE_ALIASES = {
  lab: "lab_report",
  visit: "doctor_visit",
  report: "test_result",
};

const normalizeRecordType = (value) => {
  if (!value) return value;
  const normalized = String(value).trim().toLowerCase();
  return RECORD_TYPE_ALIASES[normalized] || normalized;
};

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

    const normalizedRecordType = normalizeRecordType(recordType);
    if (
      normalizedRecordType &&
      !VALID_RECORD_TYPES.includes(normalizedRecordType)
    ) {
      return next(
        new AppError(
          `Invalid record type. Must be one of: ${VALID_RECORD_TYPES.join(", ")}`,
          400,
        ),
      );
    }
    const UUID_RE =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (patientId && !UUID_RE.test(String(patientId))) {
      return next(new AppError("Invalid patient ID format", 400));
    }
    if (doctorId && !UUID_RE.test(String(doctorId))) {
      return next(new AppError("Invalid doctor ID format", 400));
    }

    const query = {};

    if (req.hospitalId && req.user.role !== "super_admin") {
      query.hospitalId = req.hospitalId;
    }

    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (normalizedRecordType) query.recordType = normalizedRecordType;
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);

    const skip = (page - 1) * limit;
    const options = {
      sort: "record_date DESC",
      offset: skip,
      limit: parseInt(limit),
    };

    const medicalRecords = await medicalRecordRepository.findWithFilters(
      query,
      options,
    );
    const total = await medicalRecordRepository.count(query);

    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({
      success: true,
      status: "success",
      message: "Medical records retrieved successfully",

      data: {
        medicalRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: totalPages,
        },
        data: medicalRecords,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1,
      }
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
    const normalizedRecordType = normalizeRecordType(recordType);

    if (!VALID_RECORD_TYPES.includes(normalizedRecordType)) {
      return next(
        new AppError(
          `Invalid record type. Must be one of: ${VALID_RECORD_TYPES.join(", ")}`,
          400,
        ),
      );
    }

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
      return next(
        new AppError("Hospital context required to create medical record", 400),
      );
    }

    const medicalRecord = await medicalRecordRepository.create({
      patientId: patient.id, // Use id from found patient
      doctorId: req.user.id,
      hospitalId,
      recordType: normalizedRecordType,
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
      `Medical record created by ${req.user.userId} for patient ${patient.userId}`,
    );

    // Invalidate relevant caches after medical record creation
    try {
      await invalidateByPatterns(MEDICAL_RECORD_CACHE_PATTERNS);
      logger.debug("Cache invalidated after medical record creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.MEDICAL_RECORD_CREATE,
      entityType: "medicalRecord",
      entityId: medicalRecord.id,
      newValues: {
        patientId: patient.id,
        recordType: normalizedRecordType,
        title,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      status: "success",
      message: "Medical record created successfully",
      data: { medicalRecord }
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
    const normalizedRecordType = normalizeRecordType(recordType);

    // Validate recordType against allowed enum
    if (
      normalizedRecordType &&
      !VALID_RECORD_TYPES.includes(normalizedRecordType)
    ) {
      return next(
        new AppError(
          `Invalid record type. Must be one of: ${VALID_RECORD_TYPES.join(", ")}`,
          400,
        ),
      );
    }

    // Check authorization - allow patient to view own data, doctors and admins can view any
    const isOwnData =
      req.user.id === patientId || req.user.userId === patientId;
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      req.user.role !== "super_admin" &&
      !isOwnData
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to view these medical records", code: "FORBIDDEN" });
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
      return res.status(404).json({ success: false, message: "Patient not found", code: "NOT_FOUND" });
    }

    // Build query
    const query = { patientId: patient.id };

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      query.hospitalId = req.hospitalId;
    }

    if (normalizedRecordType) {
      query.recordType = normalizedRecordType;
    }

    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);

    const skip = (page - 1) * limit;
    const options = {
      sort: "record_date DESC",
      offset: skip,
      limit: parseInt(limit),
    };

    const medicalRecords = await medicalRecordRepository.findWithFilters(
      query,
      options,
    );
    const total = await medicalRecordRepository.count(query);

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Patient medical records retrieved successfully",

      data: {
        medicalRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
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
      if (
        req.hospitalId &&
        medicalRecord.hospitalId &&
        medicalRecord.hospitalId !== req.hospitalId
      ) {
        return next(new AppError("Not authorized to view this record", 403));
      }
    }

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Medical record retrieved successfully",
      data: { medicalRecord }
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
    if (medicalRecord.doctorId !== req.user.id && req.user.role !== "admin") {
      return next(new AppError("Not authorized to update this record", 403));
    }

    const updates = {
      ...req.body,
      ...(req.body?.recordType
        ? { recordType: normalizeRecordType(req.body.recordType) }
        : {}),
    };

    const updatedRecord = await medicalRecordRepository.update(
      req.params.id,
      updates,
    );

    logger.info(
      `Medical record ${req.params.id} updated by ${req.user.userId}`,
    );

    // Invalidate relevant caches after medical record update
    try {
      await invalidateByPatterns(MEDICAL_RECORD_CACHE_PATTERNS);
      logger.debug("Cache invalidated after medical record update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Medical record updated successfully",
      data: { medicalRecord: updatedRecord }
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
    if (medicalRecord.doctorId !== req.user.id && req.user.role !== "admin") {
      return next(new AppError("Not authorized to delete this record", 403));
    }

    await medicalRecordRepository.delete(req.params.id);

    logger.info(
      `Medical record ${req.params.id} deleted by ${req.user.userId}`,
    );

    // Invalidate relevant caches after medical record deletion
    try {
      await invalidateByPatterns(MEDICAL_RECORD_CACHE_PATTERNS);
      logger.debug("Cache invalidated after medical record deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Medical record deleted successfully",
      data: {}
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
      sort: "record_date DESC",
      limit: 200,
    };

    const medicalRecords = await medicalRecordRepository.findWithFilters(
      historyQuery,
      historyOptions,
    );

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
          (r) => r.recordType === "prescription",
        ),
        doctorVisits: medicalRecords.filter(
          (r) => r.recordType === "doctor_visit",
        ),
        testResults: medicalRecords.filter(
          (r) => r.recordType === "test_result",
        ),
        imaging: medicalRecords.filter((r) => r.recordType === "imaging"),
      },
      totalRecords: medicalRecords.length,
    };

    return res.status(200).json({ success: true, message: "Patient history retrieved successfully", data: history });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload file attachment for medical record
 * @route   POST /api/medical-records/upload
 * @access  Private (Doctor, Admin)
 */
exports.uploadAttachment = async (req, res, next) => {
  try {
    const { medicalRecordId, filename, mimeType, fileData } = req.body;

    if (!medicalRecordId || !filename || !mimeType || !fileData) {
      return next(
        new AppError(
          "medicalRecordId, filename, mimeType, and fileData are required",
          400,
        ),
      );
    }

    const record = await medicalRecordRepository.findById(medicalRecordId);
    if (!record) {
      return next(new AppError("Medical record not found", 404));
    }

    // Check authorization: only record doctor or admin can upload
    if (
      record.doctorId !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      return next(
        new AppError("Not authorized to upload files to this record", 403),
      );
    }

    // Create attachment in database
    const attachment = await medicalRecordRepository.createAttachment({
      medicalRecordId,
      filename,
      mimeType,
      fileData,
    });

    // Update medical record file_urls list
    const fileUrl = `/api/v1/medical-records/files/${attachment.id}`;
    const currentUrls = Array.isArray(record.file_urls) ? record.file_urls : [];
    const updatedUrls = [
      ...currentUrls,
      { id: attachment.id, name: filename, url: fileUrl },
    ];

    await medicalRecordRepository.update(medicalRecordId, {
      fileUrls: updatedUrls,
    });

    return res.status(201).json({
      success: true,
      status: "success",
      message: "File uploaded successfully",
      data: { attachment, fileUrl }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download file attachment for medical record
 * @route   GET /api/medical-records/files/:id
 * @access  Private
 */
exports.downloadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attachment = await medicalRecordRepository.findAttachmentById(id);

    if (!attachment) {
      return next(new AppError("File not found", 404));
    }

    // Access check: patient of record, or doctor/admin can access
    const record = await medicalRecordRepository.findById(
      attachment.medical_record_id,
    );
    if (record) {
      const role = req.user.role;
      if (role === "patient") {
        if (record.patientId !== req.user.id) {
          return next(new AppError("Not authorized to access this file", 403));
        }
      } else if (role !== "super_admin") {
        if (req.hospitalId && record.hospitalId !== req.hospitalId) {
          return next(new AppError("Not authorized to access this file", 403));
        }
      }
    }

    // Set appropriate headers for file download/viewing
    res.setHeader("Content-Type", attachment.mime_type);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(attachment.filename)}"`,
    );
    res.setHeader("Content-Length", attachment.file_size);

    return res.send(attachment.file_data);
  } catch (error) {
    next(error);
  }
};
