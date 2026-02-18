const appointmentService = require("../services/appointmentService");
const { AppError } = require("../middleware/errorHandler");
const userRepository = require("../repositories/userRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const logger = require("../utils/logger");

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
        req.user.role === "patient" ? req.user._id : req.body.patientId,
      hospitalId: req.hospitalId || req.user.hospitalId || "MAIN",
    };

    const appointment = await appointmentService.createAppointment(
      appointmentData
    );

    // Invalidate relevant caches after appointment creation
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      logger.debug("Cache invalidated after appointment creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

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
    // Add hospitalId from authenticated user for multi-tenancy
    const filters = { ...req.query };
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
 * @route   GET /api/appointments/cursor
 * @access  Private
 */
exports.getAppointmentsCursor = async (req, res, next) => {
  try {
    let result;
    
    // Add hospitalId to filters for multi-tenancy (skip for super_admin)
    const filters = { ...req.query };
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    if (req.user.role === "patient") {
      result = await appointmentService.getPatientAppointmentsCursor(
        req.user._id,
        filters
      );
    } else if (req.user.role === "doctor") {
      result = await appointmentService.getDoctorAppointmentsCursor(
        req.user._id,
        filters
      );
    } else if (req.user.role === "admin") {
      // Admin can view all appointments or filter by patient/doctor
      const { patientId, doctorId } = req.query;
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
    // Add hospitalId from authenticated user for multi-tenancy
    const filters = { ...req.query };
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
    
    // Add hospitalId to filters for multi-tenancy (skip for super_admin)
    const filters = { ...req.query };
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    if (req.user.role === "patient") {
      result = await appointmentService.getPatientAppointments(
        req.user._id,
        filters
      );
    } else if (req.user.role === "doctor") {
      result = await appointmentService.getDoctorAppointments(
        req.user._id,
        filters
      );
    } else if (req.user.role === "admin") {
      // Admin can view all appointments or filter by patient/doctor
      const { patientId, doctorId } = req.query;
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

    // Validate ObjectId format to prevent casting errors
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError("Invalid appointment ID format", 400));
    }

    const appointment = await appointmentService.getAppointmentById(id);

    // Check authorization
    if (
      req.user.role !== "admin" &&
      appointment.patientId._id.toString() !== req.user._id.toString() &&
      appointment.doctorId._id.toString() !== req.user._id.toString()
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
      req.user._id,
      req.user.role
    );

    // Invalidate relevant caches after appointment status update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      logger.debug("Cache invalidated after appointment status update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

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
    const { cancelReason } = req.body;

    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.user._id,
      req.user.role,
      cancelReason
    );

    // Invalidate appointment caches after cancellation
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      logger.debug("Cache invalidated after appointment cancellation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

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
    const appointment = await appointmentService.updateAppointment(
      req.params.id,
      req.body,
      req.user._id,
      req.user.role
    );

    // Invalidate relevant caches after appointment update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
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
    const stats = await appointmentService.getAppointmentStats(
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      status: "success",
      data: { stats },
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
    const { patientId } = req.params;

    // Check authorization - allow patient to view own data, doctors and admins can view any
    const isOwnData =
      req.user.userId === patientId || req.user._id.toString() === patientId;
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
      // Legacy MongoDB ObjectId lookup
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
