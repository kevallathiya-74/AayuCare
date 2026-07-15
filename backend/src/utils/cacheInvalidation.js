const { deleteCacheByPattern } = require("../config/cache");
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

const AI_CACHE_PATTERNS = ["v1:cache:ai:*", "cache:ai:*"];

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

const AUTH_PASSWORD_CACHE_PATTERNS = ["v1:cache:session:*", "cache:session:*"];

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

module.exports = {
  invalidateByPatterns,
  APPOINTMENT_CACHE_PATTERNS,
  PATIENT_PROFILE_CACHE_PATTERNS,
  PATIENT_HEALTH_CACHE_PATTERNS,
  NOTIFICATION_CACHE_PATTERNS,
  NOTIFICATION_BROADCAST_CACHE_PATTERNS,
  EVENT_CACHE_PATTERNS,
  MEDICAL_RECORD_CACHE_PATTERNS,
  PRESCRIPTION_CACHE_PATTERNS,
  PAYMENT_CACHE_PATTERNS,
  AI_CACHE_PATTERNS,
  AI_DASHBOARD_CACHE_PATTERNS,
  AUTH_PROFILE_CACHE_PATTERNS,
  AUTH_PASSWORD_CACHE_PATTERNS,
  DOCTOR_APPOINTMENT_STATUS_CACHE_PATTERNS,
  DOCTOR_WALK_IN_REGISTRATION_CACHE_PATTERNS,
  DOCTOR_PROFILE_CACHE_PATTERNS,
  DOCTOR_SCHEDULE_CACHE_PATTERNS,
  DOCTOR_SCHEDULE_BOOTSTRAP_CACHE_PATTERNS,
};
