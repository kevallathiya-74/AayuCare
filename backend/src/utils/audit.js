/**
 * Audit Logging Utility
 * Records sensitive actions to audit_logs table for compliance and security tracking.
 *
 * Section 29.2 — MANDATORY: All sensitive actions must be tracked.
 * Never throws — audit logging must never block or fail primary operations.
 */

const { pool } = require("../config/postgres");
const logger = require("./logger");

/**
 * Supported audit actions (Section 29.2)
 */
const AUDIT_ACTIONS = {
  // Auth
  USER_REGISTER:          "user_register",
  USER_LOGIN:             "user_login",
  USER_LOGOUT:            "user_logout",
  // Profile
  PROFILE_UPDATE:         "profile_update",
  PASSWORD_CHANGE:        "password_change",
  ROLE_CHANGE:            "role_change",
  // Appointments
  APPOINTMENT_CREATE:     "appointment_create",
  APPOINTMENT_CANCEL:     "appointment_cancel",
  APPOINTMENT_COMPLETE:   "appointment_complete",
  APPOINTMENT_UPDATE:     "appointment_update",
  // Payments
  PAYMENT_CREATE:         "payment_create",
  PAYMENT_REFUND:         "payment_refund",
  // Medical records
  MEDICAL_RECORD_VIEW:    "medical_record_view",
  MEDICAL_RECORD_CREATE:  "medical_record_create",
  MEDICAL_RECORD_UPDATE:  "medical_record_update",
  // Prescriptions
  PRESCRIPTION_CREATE:    "prescription_create",
  PRESCRIPTION_UPDATE:    "prescription_update",
  // Admin
  ADMIN_ACTION:           "admin_action",
  USER_STATUS_CHANGE:     "user_status_change",
  USER_DELETE:            "user_delete",
  BULK_UPDATE:            "bulk_update",
};

/**
 * Write an audit log entry.
 * @param {object} params
 * @param {string|null} params.userId    - UUID of the actor (from users.id), or null for system
 * @param {string}      params.action    - One of AUDIT_ACTIONS values
 * @param {string|null} [params.entityType] - e.g. 'appointment', 'user', 'prescription'
 * @param {string|null} [params.entityId]   - UUID of the affected record
 * @param {object|null} [params.oldValues]  - Previous state (JSONB)
 * @param {object|null} [params.newValues]  - New state (JSONB)
 * @param {object|null} [params.req]        - Express request (for IP / user-agent)
 */
async function writeAuditLog({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  oldValues = null,
  newValues = null,
  req = null,
}) {
  try {
    // Sanitize x-forwarded-for: take only the first (client) IP and validate format
    const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
    const IPV6_REGEX = /^[0-9a-fA-F:]+$/;
    const rawIp = req
      ? (req.headers["x-forwarded-for"] || req.ip || null)
      : null;
    const firstIp = rawIp ? String(rawIp).split(',')[0].trim() : null;
    const ipAddress = firstIp && (IPV4_REGEX.test(firstIp) || IPV6_REGEX.test(firstIp))
      ? firstIp
      : null;
    const userAgent = req ? (req.get("user-agent") || null) : null;

    await pool.query(
      `INSERT INTO audit_logs
         (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, successful)
       VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8, TRUE)`,
      [
        userId || null,
        action,
        entityType || null,
        entityId ? String(entityId) : null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } catch (err) {
    // Audit failures must never break primary operations
    logger.warn("Audit log write failed", {
      action,
      entityType,
      entityId,
      error: err.message,
    });
  }
}

module.exports = { writeAuditLog, AUDIT_ACTIONS };
