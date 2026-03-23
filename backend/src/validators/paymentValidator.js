/**
 * Payment Validator
 * Joi validation for payment endpoints
 */

const Joi = require('joi');

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const createPaymentSchema = Joi.object({
  appointmentId: Joi.string().pattern(UUID_REGEX).required().messages({
    'string.pattern.base': 'appointmentId must be a valid UUID',
    'any.required': 'appointmentId is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'amount must be a positive number',
    'any.required': 'amount is required',
  }),
  method: Joi.string().valid('cash', 'online', 'insurance').required().messages({
    'any.only': 'method must be one of: cash, online, insurance',
  }),
  transactionId: Joi.string().max(200).optional().allow(''),
});

const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').required().messages({
    'any.only': 'status must be one of: pending, completed, failed, refunded',
    'any.required': 'status is required',
  }),
  transactionId: Joi.string().max(200).optional().allow(''),
});

exports.validateCreatePayment = (req, res, next) => {
  const { error } = createPaymentSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: error.details.map(d => d.message),
    });
  }
  next();
};

exports.validateUpdatePaymentStatus = (req, res, next) => {
  const { error } = updatePaymentStatusSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: error.details.map(d => d.message),
    });
  }
  next();
};
