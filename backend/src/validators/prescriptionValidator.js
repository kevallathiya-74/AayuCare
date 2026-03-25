/**
 * Prescription Validator
 * Joi validation for prescription creation and updates
 */

const Joi = require('joi');
const { sendError } = require('../utils/apiResponse');

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const medicineSchema = Joi.object({
  name: Joi.string().trim().max(200).required().messages({
    'any.required': 'Medicine name is required',
  }),
  genericName: Joi.string().trim().max(200).optional().allow(''),
  dosage: Joi.string().trim().max(100).required().messages({
    'any.required': 'Dosage is required',
  }),
  frequency: Joi.string().trim().max(100).required().messages({
    'any.required': 'Frequency is required',
  }),
  duration: Joi.string().trim().max(100).required().messages({
    'any.required': 'Duration is required',
  }),
  timing: Joi.string().valid('before_food', 'after_food', 'with_food', 'anytime').optional(),
  instructions: Joi.string().max(500).optional().allow(''),
  price: Joi.number().min(0).optional(),
});

const createPrescriptionSchema = Joi.object({
  patientId: Joi.string().pattern(UUID_REGEX).required().messages({
    'string.pattern.base': 'patientId must be a valid UUID',
    'any.required': 'patientId is required',
  }),
  doctorId: Joi.string().pattern(UUID_REGEX).required().messages({
    'string.pattern.base': 'doctorId must be a valid UUID',
  }),
  appointmentId: Joi.string().pattern(UUID_REGEX).optional().allow(''),
  hospitalId: Joi.string().required().messages({
    'any.required': 'hospitalId is required',
  }),
  medicines: Joi.array().items(medicineSchema).min(1).required().messages({
    'array.min': 'At least one medicine is required',
    'any.required': 'medicines array is required',
  }),
  diagnosis: Joi.string().max(1000).optional().allow(''),
  instructions: Joi.string().max(2000).optional().allow(''),
  followUpDate: Joi.date().iso().optional(),
  prescriptionDate: Joi.date().iso().optional(),
});

const updatePharmacyStatusSchema = Joi.object({
  pharmacyStatus: Joi.string()
    .valid('pending', 'preparing', 'ready', 'dispensed', 'cancelled')
    .required()
    .messages({
      'any.only': 'pharmacyStatus must be one of: pending, preparing, ready, dispensed, cancelled',
      'any.required': 'pharmacyStatus is required',
    }),
});

exports.validateCreatePrescription = (req, res, next) => {
  const { error } = createPrescriptionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return sendError(
      res,
      req,
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      error.details.map((d) => d.message)
    );
  }
  next();
};

exports.validateUpdatePharmacyStatus = (req, res, next) => {
  const { error } = updatePharmacyStatusSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return sendError(
      res,
      req,
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      error.details.map((d) => d.message)
    );
  }
  next();
};
