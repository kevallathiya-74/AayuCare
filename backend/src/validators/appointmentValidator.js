/**
 * Appointment Validator
 * Validates appointment-related API inputs
 */

const { body, param, query, validationResult } = require("express-validator");
const { AppError } = require("../middleware/errorHandler");
const mongoose = require("mongoose");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    return next(new AppError(errorMessages, 400));
  }
  next();
};

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format");
  }
  return true;
};

// Custom validator for date format
const isValidDate = (value) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }
  return true;
};

// Custom validator for time format (HH:MM)
const isValidTime = (value) => {
  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
    throw new Error("Time must be in HH:MM format");
  }
  return true;
};

exports.validateCreateAppointment = [
  body("doctorId")
    .notEmpty()
    .withMessage("Doctor ID is required")
    .custom(isValidObjectId),

  body("appointmentDate")
    .notEmpty()
    .withMessage("Appointment date is required")
    .custom(isValidDate)
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        throw new Error("Appointment date cannot be in the past");
      }
      return true;
    }),

  body("appointmentTime")
    .notEmpty()
    .withMessage("Appointment time is required")
    .custom(isValidTime),

  body("type")
    .notEmpty()
    .withMessage("Appointment type is required")
    .isIn(["clinic_visit", "telemedicine", "emergency", "follow_up", "walk-in"])
    .withMessage("Invalid appointment type"),

  body("hospitalId")
    .notEmpty()
    .withMessage("Hospital ID is required")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Hospital ID must be between 1 and 50 characters"),

  body("symptoms")
    .optional()
    .isArray()
    .withMessage("Symptoms must be an array"),

  body("symptoms.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Each symptom must be between 1 and 200 characters"),

  body("chiefComplaint")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Chief complaint cannot exceed 500 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),

  validate,
];

exports.validateUpdateAppointmentStatus = [
  param("id").custom(isValidObjectId),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["scheduled", "confirmed", "completed", "cancelled", "no_show"])
    .withMessage("Invalid appointment status"),

  validate,
];

exports.validateCancelAppointment = [
  param("id").custom(isValidObjectId),

  body("cancelReason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cancel reason cannot exceed 500 characters"),

  validate,
];

exports.validateGetAppointments = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("status")
    .optional()
    .isIn([
      "scheduled",
      "confirmed",
      "completed",
      "cancelled",
      "no_show",
      "all",
    ])
    .withMessage("Invalid status filter"),

  query("startDate").optional().custom(isValidDate),

  query("endDate").optional().custom(isValidDate),

  validate,
];

exports.validateGetAvailableSlots = [
  param("doctorId").custom(isValidObjectId),

  query("date").notEmpty().withMessage("Date is required").custom(isValidDate),

  validate,
];
