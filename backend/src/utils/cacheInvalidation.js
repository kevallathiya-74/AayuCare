const { deleteCacheByPattern } = require("../config/redis");
const logger = require("./logger");

const APPOINTMENT_CACHE_PATTERNS = [
  "v1:cache:appointments:*",
  "v1:cache:dashboard:*",
  "v1:cache:notifications:*",
  "v1:cache:doctors:*",
  "v1:cache:patients:*",
];

const PATIENT_PROFILE_CACHE_PATTERNS = [
  "v1:cache:patient:*",
  "cache:patient:*",
  "v1:cache:user:*",
  "v1:cache:dashboard:*",
];

const PATIENT_HEALTH_CACHE_PATTERNS = [
  "v1:cache:patient:*",
  "cache:patient:*",
  "v1:cache:health:*",
  "cache:health:*",
  "v1:cache:dashboard:*",
];

const NOTIFICATION_CACHE_PATTERNS = [
  "v1:cache:notification:*",
  "cache:notification:*",
];

const NOTIFICATION_BROADCAST_CACHE_PATTERNS = [
  ...NOTIFICATION_CACHE_PATTERNS,
  "v1:cache:dashboard:*",
];

const EVENT_CACHE_PATTERNS = [
  "v1:cache:event:*",
  "cache:event:*",
  "v1:cache:dashboard:*",
];

const MEDICAL_RECORD_CACHE_PATTERNS = [
  "v1:cache:medicalrecord:*",
  "cache:medicalrecord:*",
  "v1:cache:dashboard:*",
];

const PRESCRIPTION_CACHE_PATTERNS = [
  "v1:cache:prescription:*",
  "cache:prescription:*",
  "v1:cache:dashboard:*",
];

const PAYMENT_CACHE_PATTERNS = [
  "v1:cache:payment:*",
  "cache:payment:*",
  "v1:cache:dashboard:*",
];

const AI_CACHE_PATTERNS = [
  "v1:cache:ai:*",
  "cache:ai:*",
];

const AI_DASHBOARD_CACHE_PATTERNS = [
  ...AI_CACHE_PATTERNS,
  "v1:cache:dashboard:*",
];

const AUTH_PROFILE_CACHE_PATTERNS = [
  "v1:cache:user:*",
  "v1:cache:doctors:*",
  "v1:cache:doctor:*",
  "v1:cache:patient:*",
  "v1:cache:*patients*",
  "cache:*",
];

const AUTH_PASSWORD_CACHE_PATTERNS = [
  "v1:cache:session:*",
  "cache:session:*",
];

const DOCTOR_APPOINTMENT_STATUS_CACHE_PATTERNS = [
  "v1:cache:appointments:*",
  "cache:appointments:*",
  "v1:cache:dashboard:*",
];

const DOCTOR_WALK_IN_REGISTRATION_CACHE_PATTERNS = [
  "v1:cache:user:*",
  "v1:cache:patient:*",
  "cache:patient:*",
  "v1:cache:appointments:*",
  "cache:appointments:*",
  "v1:cache:dashboard:*",
];

const DOCTOR_PROFILE_CACHE_PATTERNS = [
  "v1:cache:user:*",
  "v1:cache:doctors:*",
  "v1:cache:doctor:*",
  "v1:cache:dashboard:*",
];

const DOCTOR_SCHEDULE_CACHE_PATTERNS = [
  "v1:cache:doctors:*",
  "v1:cache:doctor:*",
  "v1:cache:dashboard:*",
];

const DOCTOR_SCHEDULE_BOOTSTRAP_CACHE_PATTERNS = [
  "v1:cache:doctors:*",
  "v1:cache:doctor:*",
];

const invalidateByPatterns = async (patterns = []) => {
  const uniquePatterns = [...new Set(patterns.filter(Boolean))];

  for (const pattern of uniquePatterns) {
    try {
      await deleteCacheByPattern(pattern);
    } catch (error) {
      logger.warn(`Cache invalidation failed for ${pattern}: ${error.message}`);
    }
  }
};

const invalidateAfterAppointmentMutation = async () => {
  await invalidateByPatterns(APPOINTMENT_CACHE_PATTERNS);
  logger.debug("Appointment-related cache invalidation completed");
};

const invalidateAfterPatientProfileMutation = async () => {
  await invalidateByPatterns(PATIENT_PROFILE_CACHE_PATTERNS);
  logger.debug("Patient profile cache invalidation completed");
};

const invalidateAfterPatientHealthMutation = async () => {
  await invalidateByPatterns(PATIENT_HEALTH_CACHE_PATTERNS);
  logger.debug("Patient health cache invalidation completed");
};

const invalidateAfterNotificationMutation = async () => {
  await invalidateByPatterns(NOTIFICATION_CACHE_PATTERNS);
  logger.debug("Notification cache invalidation completed");
};

const invalidateAfterNotificationBroadcastMutation = async () => {
  await invalidateByPatterns(NOTIFICATION_BROADCAST_CACHE_PATTERNS);
  logger.debug("Notification broadcast cache invalidation completed");
};

const invalidateAfterEventMutation = async () => {
  await invalidateByPatterns(EVENT_CACHE_PATTERNS);
  logger.debug("Event cache invalidation completed");
};

const invalidateAfterMedicalRecordMutation = async () => {
  await invalidateByPatterns(MEDICAL_RECORD_CACHE_PATTERNS);
  logger.debug("Medical record cache invalidation completed");
};

const invalidateAfterPrescriptionMutation = async () => {
  await invalidateByPatterns(PRESCRIPTION_CACHE_PATTERNS);
  logger.debug("Prescription cache invalidation completed");
};

const invalidateAfterPaymentMutation = async () => {
  await invalidateByPatterns(PAYMENT_CACHE_PATTERNS);
  logger.debug("Payment cache invalidation completed");
};

const invalidateAfterAiMutation = async () => {
  await invalidateByPatterns(AI_CACHE_PATTERNS);
  logger.debug("AI cache invalidation completed");
};

const invalidateAfterAiDashboardMutation = async () => {
  await invalidateByPatterns(AI_DASHBOARD_CACHE_PATTERNS);
  logger.debug("AI dashboard cache invalidation completed");
};

const invalidateAfterAuthProfileMutation = async () => {
  await invalidateByPatterns(AUTH_PROFILE_CACHE_PATTERNS);
  logger.debug("Auth profile cache invalidation completed");
};

const invalidateAfterPasswordMutation = async (userId) => {
  const patterns = [...AUTH_PASSWORD_CACHE_PATTERNS];

  if (userId) {
    patterns.push(`v1:cache:user:${userId}:*`, `cache:user:${userId}:*`);
  }

  await invalidateByPatterns(patterns);
  logger.debug("Auth password/session cache invalidation completed");
};

const invalidateAfterDoctorAppointmentStatusMutation = async () => {
  await invalidateByPatterns(DOCTOR_APPOINTMENT_STATUS_CACHE_PATTERNS);
  logger.debug("Doctor appointment status cache invalidation completed");
};

const invalidateAfterDoctorWalkInRegistrationMutation = async () => {
  await invalidateByPatterns(DOCTOR_WALK_IN_REGISTRATION_CACHE_PATTERNS);
  logger.debug("Doctor walk-in registration cache invalidation completed");
};

const invalidateAfterDoctorProfileMutation = async () => {
  await invalidateByPatterns(DOCTOR_PROFILE_CACHE_PATTERNS);
  logger.debug("Doctor profile cache invalidation completed");
};

const invalidateAfterDoctorScheduleMutation = async () => {
  await invalidateByPatterns(DOCTOR_SCHEDULE_CACHE_PATTERNS);
  logger.debug("Doctor schedule cache invalidation completed");
};

const invalidateAfterDoctorScheduleBootstrapMutation = async () => {
  await invalidateByPatterns(DOCTOR_SCHEDULE_BOOTSTRAP_CACHE_PATTERNS);
  logger.debug("Doctor schedule bootstrap cache invalidation completed");
};

module.exports = {
  invalidateByPatterns,
  invalidateAfterAppointmentMutation,
  invalidateAfterPatientProfileMutation,
  invalidateAfterPatientHealthMutation,
  invalidateAfterNotificationMutation,
  invalidateAfterNotificationBroadcastMutation,
  invalidateAfterEventMutation,
  invalidateAfterMedicalRecordMutation,
  invalidateAfterPrescriptionMutation,
  invalidateAfterPaymentMutation,
  invalidateAfterAiMutation,
  invalidateAfterAiDashboardMutation,
  invalidateAfterAuthProfileMutation,
  invalidateAfterPasswordMutation,
  invalidateAfterDoctorAppointmentStatusMutation,
  invalidateAfterDoctorWalkInRegistrationMutation,
  invalidateAfterDoctorProfileMutation,
  invalidateAfterDoctorScheduleMutation,
  invalidateAfterDoctorScheduleBootstrapMutation,
};
