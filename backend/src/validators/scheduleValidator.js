/**
 * Schedule Validator
 * Joi validation schemas for schedule endpoints
 */

const Joi = require('joi');
const { sendError } = require('../utils/apiResponse');

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const timeSlotSchema = Joi.object({
  startTime: Joi.string().pattern(TIME_REGEX).required().messages({
    'string.pattern.base': 'startTime must be in HH:MM format (e.g. 09:00)',
    'any.required': 'startTime is required',
  }),
  endTime: Joi.string().pattern(TIME_REGEX).required().messages({
    'string.pattern.base': 'endTime must be in HH:MM format (e.g. 17:00)',
    'any.required': 'endTime is required',
  }),
  isAvailable: Joi.boolean().default(true),
});

const dayScheduleSchema = Joi.object({
  dayOfWeek: Joi.string().lowercase().valid(...VALID_DAYS).required().messages({
    'any.only': `dayOfWeek must be one of: ${VALID_DAYS.join(', ')}`,
    'any.required': 'dayOfWeek is required',
  }),
  isAvailable: Joi.boolean().default(true),
  timeSlots: Joi.array().items(timeSlotSchema).default([]),
  breakTime: Joi.object({
    startTime: Joi.string().pattern(TIME_REGEX).optional(),
    endTime: Joi.string().pattern(TIME_REGEX).optional(),
  }).optional(),
  notes: Joi.string().max(500).optional().allow(''),
});

const weeklyScheduleSchema = Joi.object({
  schedules: Joi.array().items(dayScheduleSchema).min(1).required().messages({
    'array.min': 'schedules must contain at least one day',
    'any.required': 'schedules array is required',
  }),
});

/**
 * Validate weekly schedule creation/update
 */
exports.validateSchedule = (req, res, next) => {
  const { error } = weeklyScheduleSchema.validate(req.body, { abortEarly: false });
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

/**
 * Validate time slot add
 */
exports.validateTimeSlot = (req, res, next) => {
  const { error } = timeSlotSchema.validate(req.body, { abortEarly: false });
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
