/**
 * AI Validator
 * Validates AI-related API inputs
 */

const { body, param, validationResult } = require("express-validator");
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

exports.validateAnalyzeSymptoms = [
  body("symptoms")
    .notEmpty()
    .withMessage("At least one symptom is required")
    .isArray({ min: 1 })
    .withMessage("Symptoms must be a non-empty array"),

  body("symptoms.*")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Each symptom must be between 2 and 200 characters"),

  body("duration")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Duration cannot exceed 100 characters"),

  body("severity")
    .optional()
    .isIn(["mild", "moderate", "severe"])
    .withMessage("Severity must be mild, moderate, or severe"),

  validate,
];

exports.validateRiskScore = [
  body("age")
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage("Age must be between 0 and 150"),

  body("bp")
    .optional()
    .matches(/^\d{2,3}\/\d{2,3}$/)
    .withMessage(
      "Blood pressure must be in format systolic/diastolic (e.g., 120/80)"
    ),

  body("sugar")
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage("Blood sugar must be between 0 and 1000"),

  body("weight")
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage("Weight must be between 1 and 500 kg"),

  body("height")
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage("Height must be between 30 and 300 cm"),

  body("medicalHistory")
    .optional()
    .isArray()
    .withMessage("Medical history must be an array"),

  validate,
];

exports.validateDietRecommendations = [
  body("age")
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage("Age must be between 0 and 150"),

  body("weight")
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage("Weight must be between 1 and 500 kg"),

  body("height")
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage("Height must be between 30 and 300 cm"),

  body("conditions")
    .optional()
    .isArray()
    .withMessage("Conditions must be an array"),

  body("allergies")
    .optional()
    .isArray()
    .withMessage("Allergies must be an array"),

  validate,
];

exports.validateExerciseRecommendations = [
  body("age")
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage("Age must be between 0 and 150"),

  body("fitness")
    .optional()
    .isIn(["sedentary", "light", "moderate", "active", "very_active"])
    .withMessage(
      "Fitness level must be sedentary, light, moderate, active, or very_active"
    ),

  body("conditions")
    .optional()
    .isArray()
    .withMessage("Conditions must be an array"),

  validate,
];

exports.validatePatientId = [
  param("patientId")
    .trim()
    .notEmpty()
    .withMessage("Patient ID is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Patient ID must be between 3 and 20 characters"),

  validate,
];
