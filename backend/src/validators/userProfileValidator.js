/**
 * User Profile Validator
 * Joi validation for user profile update endpoints
 */

const Joi = require('joi');
const { sendError } = require('../utils/apiResponse');

const updateUserProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).optional().messages({
    'string.pattern.base': 'Please enter a valid phone number',
  }),
  dateOfBirth: Joi.date().iso().max('now').optional().messages({
    'date.max': 'Date of birth cannot be in the future',
  }),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  address: Joi.string().max(500).optional().allow(''),
  emergencyContactName: Joi.string().max(100).optional().allow(''),
  emergencyContactPhone: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).optional().allow('').messages({
    'string.pattern.base': 'Please enter a valid emergency contact phone number',
  }),
  emergencyContactRelation: Joi.string().max(50).optional().allow(''),
  allergies: Joi.array().items(Joi.string().max(100)).optional(),
  chronicConditions: Joi.array().items(Joi.string().max(100)).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const updateDoctorProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).optional(),
  specialization: Joi.string().max(100).optional(),
  qualification: Joi.string().max(200).optional(),
  experience: Joi.number().min(0).max(70).optional(),
  department: Joi.string().max(100).optional(),
  consultationFee: Joi.number().min(0).optional(),
  bio: Joi.string().max(1000).optional().allow(''),
  licenseNumber: Joi.string().max(100).optional().allow(''),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

exports.validateUpdateUserProfile = (req, res, next) => {
  const { error } = updateUserProfileSchema.validate(req.body, { abortEarly: false });
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

exports.validateUpdateDoctorProfile = (req, res, next) => {
  const { error } = updateDoctorProfileSchema.validate(req.body, { abortEarly: false });
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
