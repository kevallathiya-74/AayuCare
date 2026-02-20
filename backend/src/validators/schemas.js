const Joi = require("joi");

/**
 * Validation Schemas using Joi
 * Centralized request validation for all endpoints
 */

// User registration validation
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required(),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must be at least 8 characters and contain uppercase, lowercase, and number')
    .required(),
  role: Joi.string().valid("admin", "doctor", "patient").required(),
  hospitalId: Joi.string().when("role", {
    is: Joi.not("super_admin"),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  hospitalName: Joi.string().max(255).optional(),

  // Doctor specific fields
  specialization: Joi.string().when("role", {
    is: "doctor",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  qualification: Joi.string().when("role", {
    is: "doctor",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  experience: Joi.number().integer().min(0).when("role", {
    is: "doctor",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  consultationFee: Joi.number().min(0).when("role", {
    is: "doctor",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  // Patient specific fields
  dateOfBirth: Joi.date().when("role", {
    is: "patient",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  gender: Joi.string().lowercase().valid("male", "female", "other").when("role", {
    is: "patient",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  bloodGroup: Joi.string().when("role", {
    is: "patient",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  address: Joi.string().max(500).when("role", {
    is: "patient",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  emergencyContactName: Joi.string().max(255).when("role", {
    is: "patient",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  emergencyContactPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .when("role", {
      is: "patient",
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }),
  allergies: Joi.array().items(Joi.string()).when("role", {
    is: "patient",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  chronicConditions: Joi.array().items(Joi.string()).when("role", {
    is: "patient",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
});

// Login validation
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Appointment creation validation
const createAppointmentSchema = Joi.object({
  doctorId: Joi.string().uuid().required(),
  patientId: Joi.string().uuid().optional(),
  appointmentDate: Joi.date().required(),
  appointmentTime: Joi.string().required(),
  type: Joi.string()
    .valid("consultation", "follow_up", "emergency")
    .default("consultation"),
  symptoms: Joi.array().items(Joi.string()).optional(),
  chiefComplaint: Joi.string().max(500).optional(),
});

// Appointment update validation
const updateAppointmentSchema = Joi.object({
  status: Joi.string()
    .valid(
      "scheduled",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show"
    )
    .optional(),
  appointmentDate: Joi.date().optional(),
  appointmentTime: Joi.string().optional(),
  notes: Joi.string().max(1000).optional(),
  cancellationReason: Joi.string().max(500).optional(),
}).min(1);

// Payment validation
const createPaymentSchema = Joi.object({
  appointmentId: Joi.string().uuid().required(),
  amount: Joi.number().min(0).required(),
  paymentMethod: Joi.string().valid("cash", "card", "upi", "online").optional(),
  currency: Joi.string().length(3).default("INR"),
});

// Update payment validation
const updatePaymentSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "processing", "completed", "failed", "refunded")
    .optional(),
  transactionId: Joi.string().max(255).optional(),
  paymentGateway: Joi.string().max(50).optional(),
  paidAt: Joi.date().optional(),
}).min(1);

// User profile update validation
const updateProfileSchema = Joi.object({
  // Common user fields
  name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  
  // Doctor-specific fields
  specialization: Joi.string().max(255).optional(),
  qualification: Joi.string().max(255).optional(),
  experience: Joi.number().integer().min(0).optional(),
  department: Joi.string().max(255).optional(),
  consultationFee: Joi.number().min(0).optional(),
  bio: Joi.string().max(1000).optional(),
  availability: Joi.object().optional(),
  
  // Patient-specific fields
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().lowercase().valid("male", "female", "other").optional(),
  bloodGroup: Joi.string().valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-").optional(),
  address: Joi.string().max(500).optional(),
  emergencyContactName: Joi.string().max(255).optional(),
  emergencyContactPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  chronicConditions: Joi.array().items(Joi.string()).optional(),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(100).required(),
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message(
      "New password must be at least 8 characters and contain uppercase, lowercase, and number"
    )
    .required(),
});

// Doctor profile update validation
const updateDoctorProfileSchema = Joi.object({
  specialization: Joi.string().max(255).optional(),
  qualification: Joi.string().max(255).optional(),
  experience: Joi.number().integer().min(0).optional(),
  consultationFee: Joi.number().min(0).optional(),
  bio: Joi.string().max(1000).optional(),
  availability: Joi.object().optional(),
}).min(1);

// Patient profile update validation
const updatePatientProfileSchema = Joi.object({
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().lowercase().valid("male", "female", "other").optional(),
  bloodGroup: Joi.string().optional(),
  address: Joi.string().max(500).optional(),
  emergencyContactName: Joi.string().max(255).optional(),
  emergencyContactPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  chronicConditions: Joi.array().items(Joi.string()).optional(),
}).min(1);

// Prescription validation
const createPrescriptionSchema = Joi.object({
  appointmentId: Joi.string().uuid().required(),
  patientId: Joi.string().uuid().required(),
  diagnosis: Joi.string().max(1000).optional(),
  medications: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        dosage: Joi.string().required(),
        frequency: Joi.string().required(),
        duration: Joi.string().required(),
        instructions: Joi.string().optional(),
      })
    )
    .required(),
  instructions: Joi.string().max(1000).optional(),
  followUpDate: Joi.date().optional(),
});

// Medical record validation
const createMedicalRecordSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  doctorId: Joi.string().uuid().required(),
  appointmentId: Joi.string().uuid().optional(),
  diagnosis: Joi.string().max(1000).required(),
  symptoms: Joi.array().items(Joi.string()).optional(),
  vitalSigns: Joi.object({
    bloodPressure: Joi.string().optional(),
    heartRate: Joi.number().optional(),
    temperature: Joi.number().optional(),
    weight: Joi.number().optional(),
    height: Joi.number().optional(),
  }).optional(),
  prescriptions: Joi.array().items(Joi.string()).optional(),
  labResults: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(2000).optional(),
});

// Event validation
const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(2000).required(),
  eventType: Joi.string()
    .valid("camp", "workshop", "seminar", "health_checkup", "awareness")
    .required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref("startDate")).required(),
  location: Joi.string().max(500).required(),
  capacity: Joi.number().integer().min(1).optional(),
  registrationDeadline: Joi.date().less(Joi.ref("startDate")).optional(),
  isPublic: Joi.boolean().default(true),
});

// Notification validation
const createNotificationSchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  title: Joi.string().min(3).max(255).required(),
  message: Joi.string().max(1000).required(),
  type: Joi.string()
    .valid("info", "warning", "success", "error", "appointment", "payment")
    .default("info"),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
  actionUrl: Joi.string().uri().optional(),
});

// ID validation helper
const uuidSchema = Joi.string().uuid();

module.exports = {
  registerSchema,
  loginSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  createPaymentSchema,
  updatePaymentSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateDoctorProfileSchema,
  updatePatientProfileSchema,
  createPrescriptionSchema,
  createMedicalRecordSchema,
  createEventSchema,
  createNotificationSchema,
  uuidSchema,
};
