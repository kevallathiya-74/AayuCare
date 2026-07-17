const appointmentService = require("../appointment/appointment.service");
const notificationService = require("../notification/notification.service");
const doctorRepository = require("../doctor/doctor.repository");
const { AppError } = require("../../middleware/errorHandler");
const userRepository = require("../auth/user.repository");
const appointmentRepository = require("./appointment.repository");
const logger = require("../../utils/logger");
const { writeAuditLog, AUDIT_ACTIONS } = require("../../utils/audit");


const extractFilters = (query, req) => {
  const { status, startDate, endDate, date, cursor, page, limit } = query;
  const filters = {};
  if (status) filters.status = String(status);
  if (startDate) filters.startDate = String(startDate);
  if (endDate) filters.endDate = String(endDate);
  if (date) filters.date = String(date);
  if (cursor) filters.cursor = String(cursor);
  if (page) filters.page = parseInt(String(page), 10) || 1;
  filters.limit = parseInt(String(limit), 10) || 20;
  if (req.hospitalId && req.user.role !== "super_admin") {
    filters.hospitalId = req.hospitalId;
  }
  return filters;
};

/**
 * @desc    Create new appointment
 * @route   POST /api/appointments
 * @access  Private (Patient)
 */
exports.createAppointment = async (req, res, next) => {
  try {
    const appointmentData = {
      ...req.body,
      patientId: req.user.role === "patient" ? req.user.id : req.body.patientId,
      hospitalId: req.hospitalId || req.user.hospitalId || "MAIN",
    };

    const appointment =
      await appointmentService.createAppointment(appointmentData);
      
    // Send SMS confirmation async
    Promise.all([
      userRepository.findById(appointment.patientId),
      doctorRepository.findById(appointment.doctorId)
    ]).then(([patient, doctor]) => {
      if (patient && doctor) {
        notificationService.sendAppointmentConfirmation(appointment, patient, doctor);
      }
    }).catch(err => logger.error("Failed to send appointment confirmation:", err.message));

    // Invalidate all appointment-related read caches after mutation
    try {
      await invalidateByPatterns(APPOINTMENT_CACHE_PATTERNS);
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.APPOINTMENT_CREATE,
      entityType: "appointment",
      entityId: appointment.id || null,
      newValues: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: appointment.appointmentDate,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      status: "success",
      message: "Appointment created successfully",
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all appointments with cursor-based pagination (admin only)
 * @route   GET /api/appointments/cursor
 * @access  Private (Admin)
 */
exports.getAllAppointmentsCursor = async (req, res, next) => {
  try {
    // Whitelist safe filter fields — never spread req.query directly into DB filters
    const filters = extractFilters(req.query, req);

    const result = await appointmentService.getAllAppointmentsCursor(filters);

    return res.status(200).json({ success: true, message: "Appointments retrieved successfully", data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments with cursor-based pagination (patient or doctor specific)
 * @route   POST /api/appointments/cursor
 * @access  Private
 */
exports.getAppointmentsCursor = async (req, res, next) => {
  try {
    let result;

    // Whitelist safe filter fields — never spread req.query directly into DB filters
    const filters = extractFilters(req.query, req);

    if (req.user.role === "patient") {
      result = await appointmentService.getPatientAppointmentsCursor(
        req.user.id,
        filters,
      );
    } else if (req.user.role === "doctor") {
      result = await appointmentService.getDoctorAppointmentsCursor(
        req.user.id,
        filters,
      );
    } else if (req.user.role === "admin" || req.user.role === "super_admin") {
      // Admin/super_admin can view all appointments or filter by patient/doctor
      const rawPid = Array.isArray(req.body.patientId)
        ? req.body.patientId[0]
        : req.body.patientId;
      const rawDid = Array.isArray(req.body.doctorId)
        ? req.body.doctorId[0]
        : req.body.doctorId;
      const UUID_RE =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const patientId =
        rawPid && UUID_RE.test(String(rawPid)) ? String(rawPid) : null;
      const doctorId =
        rawDid && UUID_RE.test(String(rawDid)) ? String(rawDid) : null;
      if (rawPid && !patientId)
        return next(new AppError("Invalid patient ID format", 400));
      if (rawDid && !doctorId)
        return next(new AppError("Invalid doctor ID format", 400));
      if (patientId) {
        result = await appointmentService.getPatientAppointmentsCursor(
          patientId,
          filters,
        );
      } else if (doctorId) {
        result = await appointmentService.getDoctorAppointmentsCursor(
          doctorId,
          filters,
        );
      } else {
        // No filters - get all appointments (admin only)
        result = await appointmentService.getAllAppointmentsCursor(filters);
      }
    } else {
      return next(new AppError("Not authorized to view appointments", 403));
    }

    return res.status(200).json({ success: true, message: "Appointments retrieved successfully", data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all appointments (admin only, with optional filters)
 * @route   GET /api/appointments (admin calls this)
 * @access  Private (Admin)
 */
exports.getAllAppointments = async (req, res, next) => {
  try {
    // Whitelist safe filter fields — never spread req.query directly into DB filters
    const filters = extractFilters(req.query, req);

    const result = await appointmentService.getAllAppointments(filters);

    return res.status(200).json({ success: true, message: "Appointments retrieved successfully", data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments (patient or doctor specific)
 * @route   GET /api/appointments
 * @access  Private
 */
exports.getAppointments = async (req, res, next) => {
  try {
    let result;

    // Whitelist safe filter fields — never spread req.query directly into DB filters
    const filters = extractFilters(req.query, req);

    if (req.user.role === "patient") {
      result = await appointmentService.getPatientAppointments(
        req.user.id,
        filters,
      );
    } else if (req.user.role === "doctor") {
      result = await appointmentService.getDoctorAppointments(
        req.user.id,
        filters,
      );
    } else if (req.user.role === "admin" || req.user.role === "super_admin") {
      // Admin/super_admin can view all appointments or filter by patient/doctor
      const rawPid = Array.isArray(req.body.patientId)
        ? req.body.patientId[0]
        : req.body.patientId;
      const rawDid = Array.isArray(req.body.doctorId)
        ? req.body.doctorId[0]
        : req.body.doctorId;
      const UUID_RE =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const patientId =
        rawPid && UUID_RE.test(String(rawPid)) ? String(rawPid) : null;
      const doctorId =
        rawDid && UUID_RE.test(String(rawDid)) ? String(rawDid) : null;
      if (rawPid && !patientId)
        return next(new AppError("Invalid patient ID format", 400));
      if (rawDid && !doctorId)
        return next(new AppError("Invalid doctor ID format", 400));
      if (patientId) {
        result = await appointmentService.getPatientAppointments(
          patientId,
          filters,
        );
      } else if (doctorId) {
        result = await appointmentService.getDoctorAppointments(
          doctorId,
          filters,
        );
      } else {
        // No filters - get all appointments (admin only)
        result = await appointmentService.getAllAppointments(filters);
      }
    } else {
      return next(new AppError("Not authorized to view appointments", 403));
    }

    let responseData = result;
    if (result && result.appointments && result.pagination) {
      const { appointments, pagination } = result;
      const totalPages =
        pagination.pages || Math.ceil(pagination.total / pagination.limit);
      responseData = {
        appointments,
        pagination,
        data: appointments,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1,
      };
    }

    return res.status(200).json({ success: true, message: "Appointments retrieved successfully", data: responseData });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single appointment
 * @route   GET /api/appointments/:id
 * @access  Private
 */
exports.getAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate UUID format for PostgreSQL IDs
    const UUID_REGEX =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(id)) {
      return next(new AppError("Invalid appointment ID format", 400));
    }

    const appointment = await appointmentService.getAppointmentById(id);

    // Check authorization
    if (
      req.user.role !== "admin" &&
      appointment.patientId !== req.user.id &&
      appointment.doctorId !== req.user.id
    ) {
      return next(new AppError("Not authorized to view this appointment", 403));
    }

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Appointment retrieved successfully",
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update appointment status
 * @route   PATCH /api/appointments/:id/status
 * @access  Private (Doctor, Admin)
 */
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return next(new AppError("Status is required", 400));
    }

    const appointment = await appointmentService.updateAppointmentStatus(
      req.params.id,
      status,
      req.user.id,
      req.user.role,
    );

    // Invalidate all appointment-related read caches after mutation
    try {
      await invalidateByPatterns(APPOINTMENT_CACHE_PATTERNS);
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action:
        status === "completed"
          ? AUDIT_ACTIONS.APPOINTMENT_COMPLETE
          : AUDIT_ACTIONS.APPOINTMENT_UPDATE,
      entityType: "appointment",
      entityId: req.params.id,
      newValues: { status },
      req,
    });

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Appointment status updated successfully",
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel appointment
 * @route   POST /api/appointments/:id/cancel
 * @access  Private
 */
exports.cancelAppointment = async (req, res, next) => {
  try {
    const UUID_REGEX =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(req.params.id)) {
      return next(new AppError("Invalid appointment ID format", 400));
    }
    const { cancelReason } = req.body;

    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.user.id,
      req.user.role,
      cancelReason,
    );

    // Invalidate all appointment-related read caches after mutation
    try {
      await invalidateByPatterns(APPOINTMENT_CACHE_PATTERNS);
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.APPOINTMENT_CANCEL,
      entityType: "appointment",
      entityId: req.params.id,
      newValues: { cancelReason, cancelledBy: req.user.id },
      req,
    });

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Appointment cancelled successfully",
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update appointment details
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
exports.updateAppointment = async (req, res, next) => {
  try {
    const UUID_REGEX =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(req.params.id)) {
      return next(new AppError("Invalid appointment ID format", 400));
    }
    const appointment = await appointmentService.updateAppointment(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role,
    );

    // Invalidate all appointment-related read caches after mutation
    try {
      await invalidateByPatterns(APPOINTMENT_CACHE_PATTERNS);
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Appointment updated successfully",
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available time slots for a doctor
 * @route   GET /api/appointments/slots/:doctorId
 * @access  Private
 */
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return next(new AppError("Date is required", 400));
    }

    const slots = await appointmentService.getAvailableSlots(
      req.params.doctorId,
      date,
    );

    return res.status(200).json({ success: true, message: "Available slots retrieved successfully", data: slots });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointment statistics
 * @route   GET /api/appointments/stats
 * @access  Private
 */
exports.getAppointmentStats = async (req, res, next) => {
  try {
    const statsPayload = await appointmentService.getAppointmentStats(
      req.user.id,
      req.user.role,
    );

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Appointment stats retrieved successfully",

      data: {
        stats: statsPayload.statusCounts,
        dateRanges: statsPayload.dateRanges,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments for a specific patient
 * @route   POST /api/appointments/patient
 * @access  Private (Patient own data, Doctor, Admin)
 */
exports.getPatientAppointments = async (req, res, next) => {
  try {
    // Explicit String cast to prevent type confusion from HTTP parameter pollution
    const patientId = String(req.params.patientId);

    // Check authorization - allow patient to view own data, doctors and admins can view any
    const isOwnData =
      req.user.userId === patientId || req.user.id === patientId;
    if (req.user.role !== "admin" && req.user.role !== "doctor" && !isOwnData) {
      return res.status(403).json({ success: false, message: "Not authorized to view these appointments", code: "FORBIDDEN" });
    }

    // Find patient by either userId or _id (UUID format)
    let patient;
    if (
      patientId.match(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      )
    ) {
      patient = await userRepository.findById(patientId);
    } else {
      // Short user ID (e.g. PAT5) lookup
      patient = await userRepository.findByUserId(patientId);
    }

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ success: false, message: "Patient not found", code: "NOT_FOUND" });
    }

    // Build filters for appointments
    const filters = {
      patientId: patient.id,
      sortBy: "appointmentDate",
      sortOrder: "DESC",
    };

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    const appointments = await appointmentRepository.findByPatient(
      patient.id,
      filters,
    );

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Patient appointments retrieved successfully",
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
};
