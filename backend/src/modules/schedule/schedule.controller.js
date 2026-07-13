/**
 * Schedule Controller
 * Handles doctor schedule management endpoints.
 * All logic delegated to scheduleService — no DB queries here.
 */

const scheduleService = require("../schedule/schedule.service");
const { AppError } = require("../../middleware/errorHandler");
const { sendSuccess } = require("../../utils/apiResponse");

/**
 * @desc    Get a doctor's full weekly schedule
 * @route   GET /api/schedules/:doctorId
 * @access  Private
 */
exports.getDoctorSchedule = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const hospitalId = req.hospitalId || null;

    const schedule = await scheduleService.getDoctorSchedule(
      doctorId,
      hospitalId,
    );

    return sendSuccess(res, req, schedule, "Schedule retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available time slots for a specific day (for appointment booking)
 * @route   GET /api/schedules/:doctorId/slots
 * @access  Private
 */
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { day } = req.query;
    const hospitalId = req.hospitalId || null;

    if (!day) {
      return next(new AppError("day query parameter is required", 400));
    }

    const slots = await scheduleService.getAvailableSlots(
      doctorId,
      day,
      hospitalId,
    );

    return sendSuccess(res, req, slots, "Available slots retrieved");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or replace doctor's weekly schedule
 * @route   PUT /api/schedules/:doctorId/weekly
 * @access  Private (Doctor or Admin)
 */
exports.setWeeklySchedule = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { schedules } = req.body;
    const hospitalId = req.hospitalId || req.user.hospitalId || null;

    // Only allow doctors to set their own schedule (unless admin)
    if (req.user.role === "doctor" && req.user.id !== doctorId) {
      return next(
        new AppError("Doctors can only manage their own schedule", 403),
      );
    }

    const result = await scheduleService.setWeeklySchedule(
      doctorId,
      schedules,
      hospitalId,
    );

    return sendSuccess(
      res,
      req,
      result,
      "Weekly schedule updated successfully",
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a single day's schedule
 * @route   PATCH /api/schedules/:doctorId/day/:dayOfWeek
 * @access  Private (Doctor or Admin)
 */
exports.updateDaySchedule = async (req, res, next) => {
  try {
    const { doctorId, dayOfWeek } = req.params;
    const updates = req.body;
    const hospitalId = req.hospitalId || req.user.hospitalId || null;

    if (req.user.role === "doctor" && req.user.id !== doctorId) {
      return next(
        new AppError("Doctors can only manage their own schedule", 403),
      );
    }

    const updated = await scheduleService.updateDaySchedule(
      doctorId,
      dayOfWeek,
      updates,
      hospitalId,
    );

    return sendSuccess(res, req, updated, "Day schedule updated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a time slot to a specific day
 * @route   POST /api/schedules/:doctorId/day/:dayOfWeek/slots
 * @access  Private (Doctor or Admin)
 */
exports.addTimeSlot = async (req, res, next) => {
  try {
    const { doctorId, dayOfWeek } = req.params;
    const { startTime, endTime } = req.body;
    const hospitalId = req.hospitalId || req.user.hospitalId || null;

    if (req.user.role === "doctor" && req.user.id !== doctorId) {
      return next(
        new AppError("Doctors can only manage their own schedule", 403),
      );
    }

    const updated = await scheduleService.addTimeSlot(
      doctorId,
      dayOfWeek,
      { startTime, endTime, isAvailable: true },
      hospitalId,
    );

    return sendSuccess(res, req, updated, "Time slot added successfully", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a time slot from a specific day
 * @route   DELETE /api/schedules/:doctorId/day/:dayOfWeek/slots/:slotId
 * @access  Private (Doctor or Admin)
 */
exports.removeTimeSlot = async (req, res, next) => {
  try {
    const { doctorId, dayOfWeek, slotId } = req.params;
    const hospitalId = req.hospitalId || req.user.hospitalId || null;

    if (req.user.role === "doctor" && req.user.id !== doctorId) {
      return next(
        new AppError("Doctors can only manage their own schedule", 403),
      );
    }

    const updated = await scheduleService.removeTimeSlot(
      doctorId,
      dayOfWeek,
      slotId,
      hospitalId,
    );

    return sendSuccess(res, req, updated, "Time slot removed successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle availability for a schedule entry
 * @route   PATCH /api/schedules/entries/:scheduleId/availability
 * @access  Private (Doctor or Admin)
 */
exports.toggleAvailability = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { isAvailable } = req.body;
    const { doctorId } = req.query;
    const hospitalId = req.hospitalId || req.user.hospitalId || null;

    if (typeof isAvailable !== "boolean") {
      return next(new AppError("isAvailable must be a boolean", 400));
    }

    const updated = await scheduleService.toggleDayAvailability(
      scheduleId,
      isAvailable,
      doctorId,
      hospitalId,
    );

    return sendSuccess(
      res,
      req,
      updated,
      `Schedule availability set to ${isAvailable}`,
    );
  } catch (error) {
    next(error);
  }
};
