const { deleteCacheByPattern } = require("../config/cache");
const logger = require("./logger");

const buildPatterns = (entities, includeDashboard = false) => [
  ...entities.flatMap((e) => [`v1:cache:${e}:*`, `cache:${e}:*`]),
  ...(includeDashboard ? ["v1:cache:dashboard:*"] : []),
];

const APPOINTMENT_CACHE_PATTERNS = buildPatterns(
  ["appointments", "notifications", "doctors", "patients"],
  true,
);
const PATIENT_PROFILE_CACHE_PATTERNS = buildPatterns(["patient", "user"], true);
const PATIENT_HEALTH_CACHE_PATTERNS = buildPatterns(["patient", "health"]);
const NOTIFICATION_CACHE_PATTERNS = buildPatterns(["notification"]);
const NOTIFICATION_BROADCAST_CACHE_PATTERNS = NOTIFICATION_CACHE_PATTERNS;
const EVENT_CACHE_PATTERNS = buildPatterns(["event"]);
const MEDICAL_RECORD_CACHE_PATTERNS = buildPatterns(["medicalrecord"]);
const PRESCRIPTION_CACHE_PATTERNS = buildPatterns(["prescription"]);
const PAYMENT_CACHE_PATTERNS = buildPatterns(["payment"]);
const AI_CACHE_PATTERNS = buildPatterns(["ai"]);
const AI_DASHBOARD_CACHE_PATTERNS = AI_CACHE_PATTERNS;
const AUTH_PROFILE_CACHE_PATTERNS = buildPatterns([
  "user",
  "doctors",
  "doctor",
  "patient",
  "*patients*",
]);
const AUTH_PASSWORD_CACHE_PATTERNS = buildPatterns(["session"]);
const DOCTOR_APPOINTMENT_STATUS_CACHE_PATTERNS = buildPatterns([
  "appointments",
]);
const DOCTOR_WALK_IN_REGISTRATION_CACHE_PATTERNS = buildPatterns([
  "user",
  "patient",
  "appointments",
]);
const DOCTOR_PROFILE_CACHE_PATTERNS = buildPatterns([
  "user",
  "doctors",
  "doctor",
]);
const DOCTOR_SCHEDULE_CACHE_PATTERNS = buildPatterns(["doctors", "doctor"]);
const DOCTOR_SCHEDULE_BOOTSTRAP_CACHE_PATTERNS = buildPatterns([
  "doctors",
  "doctor",
]);

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
