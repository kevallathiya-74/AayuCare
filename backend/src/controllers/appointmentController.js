const appointmentService = require("../services/appointmentService");
const { AppError } = require("../middleware/errorHandler");
const userRepository = require("../repositories/userRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const logger = require("../utils/logger");
const { deleteCacheByPattern } = require("../config/redis");
const { writeAuditLog, AUDIT_ACTIONS } = require("../utils/audit");

/**
 * @desc    Create new appointment
 * @route   POST /api/appointments
 * @access  Private (Patient)
 */
exports.createAppointment = async (req, res, next) => {
  try {
    const appointmentData = {
      ...req.body,
      patientId:
        req.user.role === "patient" ? req.user.id : req.body.patientId,
      hospitalId: req.hospitalId || req.user.hospitalId || "MAIN",
    };

    const appointment = await appointmentService.createAppointment(
      appointmentData
    );

    // Invalidate relevant caches after appointment creation
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after appointment creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.APPOINTMENT_CREATE,
      entityType: "appointment",
      entityId: appointment.id || null,
      newValues: { patientId: appointment.patientId, doctorId: appointment.doctorId, date: appointment.appointmentDate },
      req,
    });

    res.status(201).json({
      status: "success",
      message: "Appointment created successfully",
      data: { appointment },
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
    const { status, startDate, endDate, date, cursor, limit } = req.query;
    const filters = {};
    if (status)    filters.status    = String(status);
    if (startDate) filters.startDate = String(startDate);
    if (endDate)   filters.endDate   = String(endDate);
    if (date)      filters.date      = String(date);
    if (cursor)    filters.cursor    = String(cursor);
    if (limit)     filters.limit     = parseInt(String(limit), 10) || 20;
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }
    
    const result = await appointmentService.getAllAppointmentsCursor(filters);

    res.status(200).json({
      status: "success",
      data: result,
    });
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
    const { status, startDate, endDate, date, cursor, limit } = req.query;
    const filters = {};
    if (status)    filters.status    = String(status);
    if (startDate) filters.startDate = String(startDate);
    if (endDate)   filters.endDate   = String(endDate);
    if (date)      filters.date      = String(date);
    if (cursor)    filters.cursor    = String(cursor);
    if (limit)     filters.limit     = parseInt(String(limit), 10) || 20;
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    if (req.user.role === "patient") {
      result = await appointmentService.getPatientAppointmentsCursor(
        req.user.id,
        filters
      );
    } else if (req.user.role === "doctor") {
      result = await appointmentService.getDoctorAppointmentsCursor(
        req.user.id,
        filters
      );
    } else if (req.user.role === "admin" || req.user.role === "super_admin") {
      // Admin/super_admin can view all appointments or filter by patient/doctor
      const rawPid = Array.isArray(req.body.patientId) ? req.body.patientId[0] : req.body.patientId;
      const rawDid = Array.isArray(req.body.doctorId)  ? req.body.doctorId[0]  : req.body.doctorId;
      const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const patientId = rawPid && UUID_RE.test(String(rawPid)) ? String(rawPid) : null;
      const doctorId  = rawDid && UUID_RE.test(String(rawDid)) ? String(rawDid) : null;
      if (rawPid && !patientId) return next(new AppError("Invalid patient ID format", 400));
      if (rawDid && !doctorId)  return next(new AppError("Invalid doctor ID format",  400));
      if (patientId) {
        result = await appointmentService.getPatientAppointmentsCursor(
          patientId,
          filters
        );
      } else if (doctorId) {
        result = await appointmentService.getDoctorAppointmentsCursor(
          doctorId,
          filters
        );
      } else {
        // No filters - get all appointments (admin only)
        result = await appointmentService.getAllAppointmentsCursor(filters);
      }
    } else {
      return next(new AppError("Not authorized to view appointments", 403));
    }

    res.status(200).json({
      status: "success",
      data: result,
    });
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
    const { status, startDate, endDate, date, page, limit } = req.query;
    const filters = {};
    if (status)    filters.status    = String(status);
    if (startDate) filters.startDate = String(startDate);
    if (endDate)   filters.endDate   = String(endDate);
    if (date)      filters.date      = String(date);
    if (page)      filters.page      = parseInt(String(page), 10) || 1;
    if (limit)     filters.limit     = parseInt(String(limit), 10) || 20;
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }
    
    const result = await appointmentService.getAllAppointments(filters);

    res.status(200).json({
      status: "success",
      data: result,
    });
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
    const { status, startDate, endDate, date, page, limit } = req.query;
    const filters = {};
    if (status)    filters.status    = String(status);
    if (startDate) filters.startDate = String(startDate);
    if (endDate)   filters.endDate   = String(endDate);
    if (date)      filters.date      = String(date);
    if (page)      filters.page      = parseInt(String(page), 10) || 1;
    if (limit)     filters.limit     = parseInt(String(limit), 10) || 20;
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    if (req.user.role === "patient") {
      result = await appointmentService.getPatientAppointments(
        req.user.id,
        filters
      );
    } else if (req.user.role === "doctor") {
      result = await appointmentService.getDoctorAppointments(
        req.user.id,
        filters
      );
    } else if (req.user.role === "admin" || req.user.role === "super_admin") {
      // Admin/super_admin can view all appointments or filter by patient/doctor
      const rawPid = Array.isArray(req.body.patientId) ? req.body.patientId[0] : req.body.patientId;
      const rawDid = Array.isArray(req.body.doctorId)  ? req.body.doctorId[0]  : req.body.doctorId;
      const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const patientId = rawPid && UUID_RE.test(String(rawPid)) ? String(rawPid) : null;
      const doctorId  = rawDid && UUID_RE.test(String(rawDid)) ? String(rawDid) : null;
      if (rawPid && !patientId) return next(new AppError("Invalid patient ID format", 400));
      if (rawDid && !doctorId)  return next(new AppError("Invalid doctor ID format",  400));
      if (patientId) {
        result = await appointmentService.getPatientAppointments(
          patientId,
          filters
        );
      } else if (doctorId) {
        result = await appointmentService.getDoctorAppointments(
          doctorId,
          filters
        );
      } else {
        // No filters - get all appointments (admin only)
        result = await appointmentService.getAllAppointments(filters);
      }
    } else {
      return next(new AppError("Not authorized to view appointments", 403));
    }

    res.status(200).json({
      status: "success",
      data: result,
    });
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
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
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

    res.status(200).json({
      status: "success",
      data: { appointment },
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
      req.user.role
    );

    // Invalidate relevant caches after appointment status update
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after appointment status update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: req.user.id,
      action: status === "completed" ? AUDIT_ACTIONS.APPOINTMENT_COMPLETE : AUDIT_ACTIONS.APPOINTMENT_UPDATE,
      entityType: "appointment",
      entityId: req.params.id,
      newValues: { status },
      req,
    });

    res.status(200).json({
      status: "success",
      message: "Appointment status updated successfully",
      data: { appointment },
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
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(req.params.id)) {
      return next(new AppError("Invalid appointment ID format", 400));
    }
    const { cancelReason } = req.body;

    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.user.id,
      req.user.role,
      cancelReason
    );

    // Invalidate appointment caches after cancellation
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after appointment cancellation");
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

    res.status(200).json({
      status: "success",
      message: "Appointment cancelled successfully",
      data: { appointment },
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
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(req.params.id)) {
      return next(new AppError("Invalid appointment ID format", 400));
    }
    const appointment = await appointmentService.updateAppointment(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );

    // Invalidate relevant caches after appointment update
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after appointment update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(200).json({
      status: "success",
      message: "Appointment updated successfully",
      data: { appointment },
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
      date
    );

    res.status(200).json({
      status: "success",
      data: slots,
    });
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
      req.user.role
    );

    res.status(200).json({
      status: "success",
      data: {
        stats: statsPayload.statusCounts,
        dateRanges: statsPayload.dateRanges,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments for a specific patient
 * @route   GET /api/appointments/patient/:patientId
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
      return res.status(403).json({
        status: "error",
        message: "Not authorized to view these appointments",
      });
    }

    // Find patient by either userId or _id (UUID format)
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      patient = await userRepository.findById(patientId);
    } else {
      // Short user ID (e.g. PAT5) lookup
      patient = await userRepository.findByUserId(patientId);
    }

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        status: "error",
        message: "Patient not found",
      });
    }

    // Build filters for appointments
    const filters = { 
      patientId: patient.id,
      sortBy: "appointmentDate",
      sortOrder: "DESC"
    };
    
    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }
    
    const appointments = await appointmentRepository.findByPatient(patient.id, filters);

    res.status(200).json({
      status: "success",
      data: { appointments },
    });
  } catch (error) {
    next(error);
  }
};
