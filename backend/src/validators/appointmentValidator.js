/**
 * Appointment Validator
 * Validates appointment-related API inputs
 */

const { body, param, query, validationResult } = require("express-validator");
const { AppError } = require("../middleware/errorHandler");

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

// UUID regex (PostgreSQL format)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Short user/resource ID (e.g., PAT5, DOC1, APT-1234-1, HOSP1)
const SHORT_ID_REGEX = /^[A-Za-z0-9_-]{1,50}$/;

// Accepts PostgreSQL UUID or short friendly ID (e.g. PAT5, DOC1)
const isValidId = (value) => {
  if (!UUID_REGEX.test(value) && !SHORT_ID_REGEX.test(value)) {
    throw new Error("Invalid ID format");
  }
  return true;
};

// Appointment route IDs must be PostgreSQL UUIDs
const isValidAppointmentId = (value) => {
  if (!UUID_REGEX.test(value)) {
    throw new Error("Invalid appointment ID format");
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

// Custom validator for time format (HH:MM, 24-hour internally)
const isValidTime = (value) => {
  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
    throw new Error("Appointment time must be in HH:MM format (e.g., 09:00, 14:30)");
  }
  return true;
};

exports.validateCreateAppointment = [
  body("doctorId")
    .notEmpty()
    .withMessage("Doctor ID is required")
    .custom(isValidId),

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
    .isIn([
      "consultation",
      "follow_up",
      "emergency",
      "clinic_visit",
      "telemedicine",
    ])
    .withMessage("Invalid appointment type"),

  body("hospitalId")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Hospital ID must not exceed 50 characters"),

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
  param("id").custom(isValidAppointmentId),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ])
    .withMessage("Invalid appointment status"),

  validate,
];

exports.validateCancelAppointment = [
  param("id").custom(isValidAppointmentId),

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
    .custom((value) => {
      // Allow comma-separated status values
      const validStatuses = [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
        "all",
      ];
      
      // Split by comma and check each status
      const statuses = value.split(',').map(s => s.trim());
      const allValid = statuses.every(status => validStatuses.includes(status));
      
      if (!allValid) {
        throw new Error("Invalid status filter. Allowed values: " + validStatuses.join(", "));
      }
      return true;
    })
    .withMessage("Invalid status filter"),

  query("startDate").optional().custom(isValidDate),

  query("endDate").optional().custom(isValidDate),

  validate,
];

exports.validateGetAvailableSlots = [
  param("doctorId").custom(isValidId),

  query("date").notEmpty().withMessage("Date is required").custom(isValidDate),

  validate,
];
