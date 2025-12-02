/**
 * AayuCare - Validation Schemas
 * 
 * Yup validation schemas for forms throughout the app.
 */

import * as yup from 'yup';
import { isValidPhoneNumber, isValidAadhaar } from './helpers';

// Common field validations

export const phoneSchema = yup
  .string()
  .required('Phone number is required')
  .test('valid-phone', 'Please enter a valid 10-digit mobile number', (value) => {
    return isValidPhoneNumber(value || '');
  });

export const emailSchema = yup
  .string()
  .required('Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = yup
  .string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .matches(/[0-9]/, 'Password must contain at least one number')
  .matches(/[@$!%*?&#]/, 'Password must contain at least one special character');

export const nameSchema = yup
  .string()
  .required('Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

export const aadhaarSchema = yup
  .string()
  .test('valid-aadhaar', 'Please enter a valid 12-digit Aadhaar number', (value) => {
    if (!value) return true; // Optional field
    return isValidAadhaar(value);
  });

export const dateSchema = yup
  .date()
  .required('Date is required')
  .max(new Date(), 'Date cannot be in the future');

export const ageSchema = yup
  .number()
  .required('Age is required')
  .min(0, 'Age must be a positive number')
  .max(150, 'Please enter a valid age');

// Authentication schemas

export const loginSchema = yup.object().shape({
  phoneOrEmail: yup
    .string()
    .required('Phone number or email is required')
    .test('phone-or-email', 'Please enter a valid phone number or email', (value) => {
      if (!value) return false;
      // Check if it's a valid phone or email
      return isValidPhoneNumber(value) || yup.string().email().isValidSync(value);
    }),
  password: passwordSchema,
});

export const registerSchema = yup.object().shape({
  fullName: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  dateOfBirth: dateSchema,
  gender: yup
    .string()
    .required('Gender is required')
    .oneOf(['male', 'female', 'other'], 'Please select a valid gender'),
  acceptTerms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions'),
});

export const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = yup.object().shape({
  phoneOrEmail: yup
    .string()
    .required('Phone number or email is required')
    .test('phone-or-email', 'Please enter a valid phone number or email', (value) => {
      if (!value) return false;
      return isValidPhoneNumber(value) || yup.string().email().isValidSync(value);
    }),
});

export const resetPasswordSchema = yup.object().shape({
  newPassword: passwordSchema,
  confirmPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

// Profile schemas

export const profileUpdateSchema = yup.object().shape({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: dateSchema,
  gender: yup.string().oneOf(['male', 'female', 'other']),
  bloodGroup: yup.string().oneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  height: yup.number().min(50, 'Height must be at least 50 cm').max(300, 'Height cannot exceed 300 cm'),
  weight: yup.number().min(10, 'Weight must be at least 10 kg').max(500, 'Weight cannot exceed 500 kg'),
  address: yup.string().max(200, 'Address must not exceed 200 characters'),
  city: yup.string().max(50, 'City name must not exceed 50 characters'),
  state: yup.string().max(50, 'State name must not exceed 50 characters'),
  pincode: yup
    .string()
    .matches(/^\d{6}$/, 'Pincode must be 6 digits'),
  aadhaar: aadhaarSchema,
});

// Appointment schemas

export const bookAppointmentSchema = yup.object().shape({
  doctorId: yup.string().required('Please select a doctor'),
  appointmentDate: yup
    .date()
    .required('Appointment date is required')
    .min(new Date(), 'Appointment date cannot be in the past'),
  timeSlot: yup.string().required('Please select a time slot'),
  reason: yup
    .string()
    .required('Reason for visit is required')
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(500, 'Reason must not exceed 500 characters'),
  symptoms: yup.string().max(500, 'Symptoms must not exceed 500 characters'),
  isEmergency: yup.boolean(),
});

// Health record schemas

export const addHealthRecordSchema = yup.object().shape({
  recordType: yup
    .string()
    .required('Record type is required')
    .oneOf(['prescription', 'test_report', 'vaccination', 'allergy', 'surgery', 'other']),
  title: yup
    .string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: yup.string().max(500, 'Description must not exceed 500 characters'),
  recordDate: yup.date().required('Record date is required').max(new Date(), 'Date cannot be in the future'),
  doctorName: yup.string().max(100, 'Doctor name must not exceed 100 characters'),
  hospitalName: yup.string().max(100, 'Hospital name must not exceed 100 characters'),
});

// Vital signs schemas

export const vitalsSchema = yup.object().shape({
  bloodPressureSystolic: yup
    .number()
    .min(60, 'Systolic pressure must be at least 60 mmHg')
    .max(250, 'Systolic pressure cannot exceed 250 mmHg'),
  bloodPressureDiastolic: yup
    .number()
    .min(40, 'Diastolic pressure must be at least 40 mmHg')
    .max(150, 'Diastolic pressure cannot exceed 150 mmHg'),
  heartRate: yup
    .number()
    .min(30, 'Heart rate must be at least 30 bpm')
    .max(250, 'Heart rate cannot exceed 250 bpm'),
  temperature: yup
    .number()
    .min(35, 'Temperature must be at least 35°C')
    .max(45, 'Temperature cannot exceed 45°C'),
  oxygenSaturation: yup
    .number()
    .min(70, 'Oxygen saturation must be at least 70%')
    .max(100, 'Oxygen saturation cannot exceed 100%'),
  bloodGlucose: yup
    .number()
    .min(30, 'Blood glucose must be at least 30 mg/dL')
    .max(600, 'Blood glucose cannot exceed 600 mg/dL'),
  weight: yup
    .number()
    .min(10, 'Weight must be at least 10 kg')
    .max(500, 'Weight cannot exceed 500 kg'),
});

// Contact/Support schemas

export const contactSchema = yup.object().shape({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: yup
    .string()
    .required('Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must not exceed 100 characters'),
  message: yup
    .string()
    .required('Message is required')
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message must not exceed 1000 characters'),
});

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
