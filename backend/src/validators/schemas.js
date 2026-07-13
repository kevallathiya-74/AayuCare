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
    .message(
      "Password must be at least 8 characters and contain uppercase, lowercase, and number",
    )
    .required(),
  role: Joi.string().valid("doctor", "patient").required(),
  hospitalId: Joi.string().required(),
  hospitalName: Joi.string().max(255).optional(),
  isActive: Joi.boolean().default(true),

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
  department: Joi.string().max(255).when("role", {
    is: "doctor",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  licenseNumber: Joi.string().max(100).when("role", {
    is: "doctor",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  license_number: Joi.string().max(100).when("role", {
    is: "doctor",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  bio: Joi.string().max(1000).when("role", {
    is: "doctor",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  availability: Joi.object().when("role", {
    is: "doctor",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),

  // Patient specific fields
  dateOfBirth: Joi.date().when("role", {
    is: "patient",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  gender: Joi.string()
    .lowercase()
    .valid("male", "female", "other")
    .when("role", {
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
  emergencyContactRelation: Joi.string().max(100).when("role", {
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
const loginSchema = Joi.alternatives().try(
  // Email-based login
  Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
  // UserId-based login
  Joi.object({
    userId: Joi.string().min(3).required(),
    password: Joi.string().min(6).required(),
  }),
  // Identifier-based login (frontend compatibility)
  Joi.object({
    identifier: Joi.alternatives()
      .try(Joi.string().email(), Joi.string().min(3))
      .required(),
    password: Joi.string().min(6).required(),
  }),
);

// Appointment creation validation
const createAppointmentSchema = Joi.object({
  doctorId: Joi.string().uuid().required(),
  patientId: Joi.string().uuid().optional(),
  appointmentDate: Joi.date()
    .required()
    .custom((value, helpers) => {
      const selected = new Date(value);
      selected.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        return helpers.error("date.min");
      }
      return value;
    })
    .messages({
      "date.min": "Appointment date cannot be in the past",
    }),
  appointmentTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base":
        "Appointment time must be in HH:MM format (e.g., 09:00, 14:30)",
    }),
  type: Joi.string()
    .valid(
      "consultation",
      "follow_up",
      "emergency",
      "clinic_visit",
      "telemedicine",
    )
    .default("consultation"),
  symptoms: Joi.array().items(Joi.string()).optional(),
  chiefComplaint: Joi.string().max(500).optional(),
  hospitalId: Joi.string().max(50).optional(),
  notes: Joi.string().max(1000).optional(),
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
      "no_show",
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
  refundAmount: Joi.number().min(0).optional(),
  refundedAt: Joi.date().optional(),
}).min(1);

// User profile update validation
const updateProfileSchema = Joi.object({
  // Common user fields
  name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  preferred_language: Joi.string().valid("en", "hi", "gu").optional(),

  // Doctor-specific fields
  specialization: Joi.string().max(255).optional(),
  qualification: Joi.string().max(255).optional(),
  experience: Joi.number().integer().min(0).optional(),
  department: Joi.string().max(255).optional(),
  consultationFee: Joi.number().min(0).optional(),
  licenseNumber: Joi.string().max(100).optional(),
  license_number: Joi.string().max(100).optional(),
  bio: Joi.string().max(1000).optional(),
  availability: Joi.object().optional(),

  // Patient-specific fields
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().lowercase().valid("male", "female", "other").optional(),
  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .optional(),
  address: Joi.string().max(500).optional(),
  emergencyContactName: Joi.string().max(255).optional(),
  emergencyContactPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  emergencyContactRelation: Joi.string().max(100).optional(),
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
      "New password must be at least 8 characters and contain uppercase, lowercase, and number",
    )
    .required(),
});

// Doctor profile update validation
const updateDoctorProfileSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  specialization: Joi.string().max(255).optional(),
  qualification: Joi.string().max(255).optional(),
  experience: Joi.number().integer().min(0).optional(),
  consultationFee: Joi.number().min(0).optional(),
  department: Joi.string().max(255).optional(),
  licenseNumber: Joi.string().max(100).optional(),
  license_number: Joi.string().max(100).optional(),
  bio: Joi.string().max(1000).optional(),
  availability: Joi.object().optional(),
}).min(1);

// Patient profile update validation
const updatePatientProfileSchema = Joi.object({
  // Common user fields — allowed so they pass through stripUnknown
  name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  // Patient-specific fields
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().lowercase().valid("male", "female", "other").optional(),
  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .optional(),
  address: Joi.string().max(500).optional(),
  emergencyContactName: Joi.string().max(255).optional(),
  emergencyContactPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  emergencyContactRelation: Joi.string().max(100).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  chronicConditions: Joi.array().items(Joi.string()).optional(),
}).min(1);

// Prescription validation
const createPrescriptionSchema = Joi.object({
  appointmentId: Joi.string().optional(),
  // Accept UUID or custom userId format (e.g. PAT1)
  patientId: Joi.string().min(1).required(),
  diagnosis: Joi.string().max(1000).optional().allow(""),
  // Accept both key names – controller handles both
  medications: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        dosage: Joi.string().required(),
        // frequency built from timings on frontend (e.g. "morning, evening")
        frequency: Joi.string().required(),
        duration: Joi.string().required(),
        instructions: Joi.string().optional().allow(""),
        // pricing info kept for pharmacy cost calculation
        price: Joi.number().min(0).optional(),
        unitPrice: Joi.number().min(0).optional(),
      }),
    )
    .min(1)
    .optional(),
  medicines: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        dosage: Joi.string().required(),
        frequency: Joi.string().required(),
        duration: Joi.string().required(),
        instructions: Joi.string().optional().allow(""),
        price: Joi.number().min(0).optional(),
        unitPrice: Joi.number().min(0).optional(),
      }),
    )
    .min(1)
    .optional(),
  instructions: Joi.string().max(1000).optional().allow(""),
  followUpDate: Joi.date().optional().allow("", null),
  // Send options for patient app and pharmacy routing
  sendOptions: Joi.object({
    patientApp: Joi.boolean().optional(),
    hospitalPharmacy: Joi.boolean().optional(),
    externalPharmacy: Joi.boolean().optional(),
  }).optional(),
}).or("medications", "medicines"); // at least one must be provided

// Medical record validation
const createMedicalRecordSchema = Joi.object({
  patientId: Joi.string().min(1).required(),
  // recordType is required by the model
  recordType: Joi.string()
    .valid(
      "lab_report",
      "prescription",
      "doctor_visit",
      "test_result",
      "imaging",
      "other",
    )
    .required(),
  title: Joi.string().min(1).max(500).required(),
  description: Joi.string().max(2000).optional().allow(""),
  date: Joi.date().optional(),
  diagnosis: Joi.string().max(1000).optional().allow(""),
  symptoms: Joi.array().items(Joi.string()).optional(),
  medications: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().optional(),
        dosage: Joi.string().optional(),
        frequency: Joi.string().optional(),
        duration: Joi.string().optional(),
      }),
    )
    .optional(),
  labResults: Joi.array()
    .items(
      Joi.object({
        testName: Joi.string().optional(),
        value: Joi.string().optional(),
        unit: Joi.string().optional(),
        normalRange: Joi.string().optional(),
        status: Joi.string().valid("normal", "abnormal", "critical").optional(),
      }),
    )
    .optional(),
  files: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().optional(),
        fileName: Joi.string().optional(),
        fileType: Joi.string().optional(),
        fileSize: Joi.number().optional(),
      }),
    )
    .optional(),
});

// Event validation
const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(2000).required(),
  type: Joi.string()
    .valid(
      "blood-donation",
      "screening",
      "vaccination",
      "workshop",
      "health-camp",
      "awareness",
      "other",
    )
    .required(),
  hospitalId: Joi.string().uppercase().max(50).optional(),
  date: Joi.date().required(),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base":
        "startTime must be in HH:MM 24-hour format (e.g. 09:00)",
    }),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base":
        "endTime must be in HH:MM 24-hour format (e.g. 17:00)",
    }),
  // model uses 'venue', not 'location'
  venue: Joi.string().max(500).required(),
  availableSpots: Joi.number().integer().min(0).optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  benefits: Joi.array().items(Joi.string()).optional(),
  contactInfo: Joi.object({
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
  }).optional(),
  icon: Joi.string().optional(),
  color: Joi.string().optional(),
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(2000).optional(),
  type: Joi.string()
    .valid(
      "blood-donation",
      "screening",
      "vaccination",
      "workshop",
      "health-camp",
      "awareness",
      "other",
    )
    .optional(),
  date: Joi.date().optional(),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .messages({
      "string.pattern.base": "startTime must be in HH:MM 24-hour format",
    }),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .messages({
      "string.pattern.base": "endTime must be in HH:MM 24-hour format",
    }),
  venue: Joi.string().max(500).optional(),
  availableSpots: Joi.number().integer().min(0).optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  benefits: Joi.array().items(Joi.string()).optional(),
  contactInfo: Joi.object({
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
  }).optional(),
  icon: Joi.string().optional(),
  color: Joi.string().optional(),
  status: Joi.string()
    .valid("upcoming", "ongoing", "completed", "cancelled")
    .optional(),
  isActive: Joi.boolean().optional(),
});

// Notification validation
const createNotificationSchema = Joi.object({
  userId: Joi.string().optional(),
  title: Joi.string().min(1).max(255).required(),
  message: Joi.string().max(2000).required(),
  type: Joi.string()
    .valid(
      "appointment",
      "prescription",
      "lab_report",
      "event",
      "reminder",
      "system",
      "alert",
      "health_alert",
    )
    .default("system"),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .default("medium"),
  data: Joi.object().unknown(true).optional(),
  actionUrl: Joi.string().optional(),
  icon: Joi.string().optional(),
  expiresAt: Joi.date().optional(),
});

// Broadcast notification validation (admin send to multiple users)
const broadcastNotificationSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).required(),
  title: Joi.string().min(1).max(255).required(),
  message: Joi.string().max(2000).required(),
  type: Joi.string()
    .valid(
      "appointment",
      "prescription",
      "lab_report",
      "event",
      "reminder",
      "system",
      "alert",
      "health_alert",
    )
    .default("system"),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .default("medium"),
  data: Joi.object().unknown(true).optional(),
  actionUrl: Joi.string().optional(),
  icon: Joi.string().optional(),
  expiresAt: Joi.date().optional(),
});

// Walk-in patient registration validation
const walkInPatientSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  age: Joi.number().integer().min(1).max(120).required(),
  gender: Joi.string().lowercase().valid("male", "female", "other").required(),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{7,15}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be 7-15 digits, optionally starting with +",
    }),
  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .optional(),
  symptoms: Joi.string().min(2).max(500).required(),
  address: Joi.string().max(500).optional(),
  hospitalId: Joi.string().max(50).optional(),
});

// Health metric schemas
const addHealthMetricSchema = Joi.object({
  type: Joi.string()
    .valid(
      "bp",
      "sugar",
      "weight",
      "bmi",
      "temperature",
      "steps",
      "sleep",
      "water",
      "exercise",
      "stress",
      "heart-rate",
      "oxygen",
    )
    .required()
    .messages({ "any.only": "Invalid metric type" }),
  value: Joi.alternatives()
    .try(Joi.number(), Joi.object())
    .required()
    .messages({ "alternatives.match": "Value is required" }),
  notes: Joi.string().max(500).optional().allow(""),
  timestamp: Joi.date().optional(),
});

const updateHealthMetricSchema = Joi.object({
  value: Joi.alternatives().try(Joi.number(), Joi.object()).optional(),
  notes: Joi.string().max(500).optional().allow(""),
  timestamp: Joi.date().optional(),
}).min(1);

const activityUpdateSchema = Joi.object({
  type: Joi.string()
    .valid("steps", "sleep", "water", "exercise", "stress")
    .required()
    .messages({
      "any.only":
        "Invalid activity type. Must be one of: steps, sleep, water, exercise, stress",
    }),
  value: Joi.alternatives()
    .try(Joi.number(), Joi.object())
    .required()
    .messages({ "alternatives.match": "Value is required" }),
  notes: Joi.string().max(500).optional().allow(""),
});

const scheduleUpdateSchema = Joi.object({
  isAvailable: Joi.boolean().optional(),
  timeSlots: Joi.array()
    .items(
      Joi.object({
        startTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
          .required()
          .messages({
            "string.pattern.base": "startTime must be in HH:MM format",
          }),
        endTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
          .required()
          .messages({
            "string.pattern.base": "endTime must be in HH:MM format",
          }),
        maxPatients: Joi.number().integer().min(1).optional(),
        consultationDuration: Joi.number().integer().min(5).max(120).optional(),
        isAvailable: Joi.boolean().optional(),
      }),
    )
    .optional(),
  breakTime: Joi.object({
    startTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
      .required()
      .messages({
        "string.pattern.base": "Break startTime must be in HH:MM format",
      }),
    endTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
      .required()
      .messages({
        "string.pattern.base": "Break endTime must be in HH:MM format",
      }),
  })
    .optional()
    .allow(null),
  notes: Joi.string().max(500).optional().allow(""),
}).min(1);

// Prescription status update validation
const updatePrescriptionStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "pending",
      "sent_to_pharmacy",
      "processing",
      "preparing",
      "ready",
      "dispensed",
      "cancelled",
    )
    .required()
    .messages({ "any.only": "Invalid prescription status" }),
  notes: Joi.string().max(500).optional().allow(""),
});

// Pharmacy status update validation
const updatePrescriptionPharmacySchema = Joi.object({
  pharmacyStatus: Joi.string()
    .valid(
      "pending",
      "processing",
      "preparing",
      "ready",
      "dispensed",
      "cancelled",
    )
    .optional(),
  pharmacyId: Joi.string().max(100).optional(),
  dispensedAt: Joi.date().optional(),
  pharmacyNotes: Joi.string().max(500).optional().allow(""),
}).min(1);

// Admin: update user active/inactive status
const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean()
    .required()
    .messages({ "any.required": "isActive (boolean) is required" }),
  reason: Joi.string().max(500).optional().allow(""),
});

// Params schema: validate :type in /patients/:id/health-metrics/latest/:type
const getMetricTypeParamsSchema = Joi.object({
  type: Joi.string()
    .valid(
      "bp",
      "sugar",
      "weight",
      "bmi",
      "temperature",
      "steps",
      "sleep",
      "water",
      "exercise",
      "stress",
      "heart-rate",
      "oxygen",
    )
    .required()
    .messages({
      "any.only":
        "Invalid metric type. Allowed: bp, sugar, weight, bmi, temperature, steps, sleep, water, exercise, stress, heart-rate, oxygen",
    }),
});

// Schedule day-of-week param validation (used for PUT /me/schedule/:dayOfWeek and PATCH toggle)
const scheduleParamsSchema = Joi.object({
  dayOfWeek: Joi.string()
    .valid(
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    )
    .required()
    .messages({
      "any.only":
        "dayOfWeek must be a valid day name: monday, tuesday, wednesday, thursday, friday, saturday, sunday",
    }),
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
  updateEventSchema,
  createNotificationSchema,
  broadcastNotificationSchema,
  walkInPatientSchema,
  uuidSchema,
  addHealthMetricSchema,
  updateHealthMetricSchema,
  activityUpdateSchema,
  scheduleUpdateSchema,
  updateUserRoleSchema: Joi.object({
    role: Joi.string().valid("doctor", "patient", "admin").required(),
    version: Joi.number().optional(),
  }),
  bulkUpdateUsersSchema: Joi.object({
    operations: Joi.array()
      .items(
        Joi.object({
          userId: Joi.string().required(),
          action: Joi.string()
            .valid("activate", "deactivate", "delete", "updateRole")
            .required(),
          data: Joi.object().optional(),
        }),
      )
      .min(1)
      .max(100)
      .required(),
  }),
  updatePrescriptionStatusSchema,
  updatePrescriptionPharmacySchema,
  updateUserStatusSchema,
  getMetricTypeParamsSchema,
  scheduleParamsSchema,
};
