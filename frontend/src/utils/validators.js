/**
 * AayuCare - Validation Schemas
 * 
 * Yup validation schemas for forms throughout the app.
 */

import * as yup from 'yup';
import { isValidPhoneNumber, isValidAadhaar } from './helpers';

// Common field validations

export default {
  loginSchema,
  registerSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileUpdateSchema,
  bookAppointmentSchema,
  addHealthRecordSchema,
  vitalsSchema,
  contactSchema,
};

