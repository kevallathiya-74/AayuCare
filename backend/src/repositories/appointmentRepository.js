const { query, getClient } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const { mapAppointmentData, mapArray } = require("../utils/fieldMapper");

/**
 * Appointment Repository - PostgreSQL data access layer
 */
class AppointmentRepository {
  /**
   * Create appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async create(appointmentData) {
    const {
      appointmentId,
      patientId,
      doctorId,
      hospitalId,
      appointmentDate,
      appointmentTime,
      type,
      symptoms,
      chiefComplaint,
    } = appointmentData;

    const sql = `
            INSERT INTO appointments (appointment_id, patient_id, doctor_id, hospital_id, 
                                     appointment_date, appointment_time, type, symptoms, chief_complaint, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
            RETURNING id, appointment_id, patient_id, doctor_id, hospital_id, appointment_date,
                      appointment_time, status, type, symptoms, chief_complaint, created_at, updated_at
        `;

    const result = await query(sql, [
      appointmentId,
      patientId,
      doctorId,
      hospitalId,
      appointmentDate,
      appointmentTime,
      type || "consultation",
      symptoms || [],
      chiefComplaint || null,
    ]);

    return result.rows[0];
  }

  /**
   * Find appointment by ID
   * @param {string} id - Appointment UUID
   * @returns {Promise<Object|null>} Appointment object or null
   */
  async findById(id) {
    const sql = `
            SELECT a.*, 
                   p.name as patient_name, p.email as patient_email, p.phone as patient_phone,
                   d.name as doctor_name, d.email as doctor_email
            FROM appointments a
            LEFT JOIN users p ON a.patient_id = p.id
            LEFT JOIN users d ON a.doctor_id = d.id
            WHERE a.id = $1
        `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find appointments by patient
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of appointments
   */
  async findByPatient(patientId, filters = {}) {
    const {
      status,
      startDate,
      endDate,
      doctorId,
      hospitalId,
      limit = 20,
      offset = 0,
    } = filters;

    let sql = `
            SELECT a.*, 
                   p.name as patient_name, p.email as patient_email,
                   d.name as doctor_name, d.email as doctor_email,
                   doc.specialization, doc.consultation_fee
            FROM appointments a
            LEFT JOIN users p ON a.patient_id = p.id
            LEFT JOIN users d ON a.doctor_id = d.id
            LEFT JOIN doctors doc ON d.id = doc.user_id
            WHERE a.patient_id = $1
        `;

    const params = [patientId];
    let paramCount = 2;

    if (status) {
      const statusArray = Array.isArray(status)
        ? status
        : String(status)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      sql += ` AND a.status IN (${statusArray.map((_, i) => `$${paramCount + i}`).join(', ')})`;
      params.push(...statusArray);
      paramCount += statusArray.length;
    }

    if (doctorId) {
      sql += ` AND a.doctor_id = $${paramCount}`;
      params.push(doctorId);
      paramCount++;
    }

    if (hospitalId) {
      sql += ` AND a.hospital_id = $${paramCount}`;
      params.push(hospitalId);
      paramCount++;
    }

    if (startDate) {
      sql += ` AND a.appointment_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND a.appointment_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    sql += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC`;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    // Map snake_case to camelCase for frontend compatibility
    return mapArray(result.rows, mapAppointmentData);
  }

  /**
   * Find appointments by doctor
   * @param {string} doctorId - Doctor UUID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of appointments
   */
  async findByDoctor(doctorId, filters = {}) {
    const {
      status,
      startDate,
      endDate,
      patientId,
      hospitalId,
      limit = 20,
      offset = 0,
    } = filters;

    let sql = `
            SELECT a.*, 
                   p.name as patient_name, p.email as patient_email, p.phone as patient_phone,
                   pat.date_of_birth, pat.gender, pat.blood_group
            FROM appointments a
            LEFT JOIN users p ON a.patient_id = p.id
            LEFT JOIN patients pat ON p.id = pat.user_id
            WHERE a.doctor_id = $1
        `;

    const params = [doctorId];
    let paramCount = 2;

    if (status) {
      const statusArray = Array.isArray(status)
        ? status
        : String(status)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      sql += ` AND a.status IN (${statusArray.map((_, i) => `$${paramCount + i}`).join(', ')})`;
      params.push(...statusArray);
      paramCount += statusArray.length;
    }

    if (patientId) {
      sql += ` AND a.patient_id = $${paramCount}`;
      params.push(patientId);
      paramCount++;
    }

    if (hospitalId) {
      sql += ` AND a.hospital_id = $${paramCount}`;
      params.push(hospitalId);
      paramCount++;
    }

    if (startDate) {
      sql += ` AND a.appointment_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND a.appointment_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    sql += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC`;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    // Map snake_case to camelCase for frontend compatibility
    return mapArray(result.rows, mapAppointmentData);
  }

  /**
   * Find all appointments with filters (admin)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Appointments with pagination
   */
  async findAll(filters = {}) {
    const {
      hospitalId,
      patientId,
      doctorId,
      status,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
    } = filters;

    let sql = `
            SELECT a.*, 
                   p.name as patient_name, p.email as patient_email,
                   d.name as doctor_name, d.email as doctor_email,
                   doc.specialization
            FROM appointments a
            LEFT JOIN users p ON a.patient_id = p.id
            LEFT JOIN users d ON a.doctor_id = d.id
            LEFT JOIN doctors doc ON d.id = doc.user_id
            WHERE 1=1
        `;

    const params = [];
    let paramCount = 1;

    if (hospitalId) {
      sql += ` AND a.hospital_id = $${paramCount}`;
      params.push(hospitalId);
      paramCount++;
    }

    if (patientId) {
      sql += ` AND a.patient_id = $${paramCount}`;
      params.push(patientId);
      paramCount++;
    }

    if (doctorId) {
      sql += ` AND a.doctor_id = $${paramCount}`;
      params.push(doctorId);
      paramCount++;
    }

    if (status) {
      const statusArray = Array.isArray(status)
        ? status
        : String(status)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      sql += ` AND a.status IN (${statusArray.map((_, i) => `$${paramCount + i}`).join(', ')})`;
      params.push(...statusArray);
      paramCount += statusArray.length;
    }

    if (startDate) {
      sql += ` AND a.appointment_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND a.appointment_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    sql += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC`;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    // Map snake_case to camelCase for frontend compatibility
    return mapArray(result.rows, mapAppointmentData);
  }

  /**
   * Update appointment
   * @param {string} id - Appointment UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated appointment
   */
  async update(id, updates) {
    const allowedFields = [
      "status",
      "appointment_date",
      "appointment_time",
      "type",
      "symptoms",
      "chief_complaint",
      "notes",
      "cancellation_reason",
      "cancelled_by",
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      const dbField = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      if (allowedFields.includes(dbField)) {
        updateFields.push(`${dbField} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new AppError("No valid fields to update", 400);
    }

    values.push(id);

    const sql = `
            UPDATE appointments
            SET ${updateFields.join(", ")}
            WHERE id = $${paramCount}
            RETURNING id, appointment_id, patient_id, doctor_id, hospital_id, appointment_date,
                      appointment_time, status, type, symptoms, chief_complaint, notes,
                      cancellation_reason, cancelled_by, created_at, updated_at
        `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Check if time slot is available
   * @param {string} doctorId - Doctor UUID
   * @param {string} appointmentDate - Date
   * @param {string} appointmentTime - Time
   * @param {string} hospitalId - Hospital ID
   * @param {string} excludeAppointmentId - Appointment ID to exclude (for updates)
   * @returns {Promise<boolean>} True if available
   */
  async isSlotAvailable(
    doctorId,
    appointmentDate,
    appointmentTime,
    hospitalId,
    excludeAppointmentId = null
  ) {
    let sql = `
            SELECT 1 FROM appointments
            WHERE doctor_id = $1 
            AND appointment_date = $2 
            AND appointment_time = $3 
            AND hospital_id = $4
            AND status NOT IN ('cancelled', 'completed')
        `;

    const params = [doctorId, appointmentDate, appointmentTime, hospitalId];

    if (excludeAppointmentId) {
      sql += ` AND id != $5`;
      params.push(excludeAppointmentId);
    }

    sql += ` LIMIT 1`;

    const result = await query(sql, params);
    return result.rowCount === 0;
  }

  /**
   * Count appointments by status
   * @param {string} userId - User UUID (patient or doctor)
   * @param {string} role - User role
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise<Object>} Status counts
   */
  async countByStatus(userId, role, options = null) {
    const parsedOptions =
      options && typeof options === "object" && !Array.isArray(options)
        ? options
        : { hospitalId: options || null };
    const { hospitalId = null, status = null, startDate = null, endDate = null } =
      parsedOptions;

    let sql = `
            SELECT status, COUNT(*) as count
            FROM appointments
            WHERE 1=1
        `;

    const params = [];
    let paramCount = 1;

    if (role === "patient") {
      sql += ` AND patient_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    } else if (role === "doctor") {
      sql += ` AND doctor_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    } else if (role === "admin" && hospitalId) {
      sql += ` AND hospital_id = $${paramCount}`;
      params.push(hospitalId);
      paramCount++;
    }

    if (status) {
      const statusArray = Array.isArray(status)
        ? status
        : String(status)
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);

      if (statusArray.length > 0) {
        sql += ` AND status IN (${statusArray
          .map((_, index) => `$${paramCount + index}`)
          .join(", ")})`;
        params.push(...statusArray);
        paramCount += statusArray.length;
      }
    }

    if (startDate) {
      sql += ` AND appointment_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND appointment_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    sql += ` GROUP BY status`;

    const result = await query(sql, params);
    const statusCounts = result.rows.reduce((acc, row) => {
      acc[row.status] = Number(row.count || 0);
      return acc;
    }, {});

    return {
      ...statusCounts,
      total: Object.values(statusCounts).reduce(
        (sum, count) => sum + Number(count || 0),
        0
      ),
    };
  }

  /**
   * Count appointments in key date ranges
   * @param {string} userId - User UUID (patient or doctor)
   * @param {string} role - User role
   * @param {string|null} hospitalId - Hospital ID for admin scoping
   * @returns {Promise<Object>} Date range counts
   */
  async countByDateRanges(userId, role, hospitalId = null) {
    let sql = `
            SELECT
              COUNT(*) FILTER (
                WHERE appointment_date = CURRENT_DATE
              ) AS today_count,
              COUNT(*) FILTER (
                WHERE appointment_date >= CURRENT_DATE
                AND appointment_date < CURRENT_DATE + INTERVAL '7 days'
              ) AS next_7_days_count,
              COUNT(*) AS all_count
            FROM appointments
            WHERE 1=1
        `;

    const params = [];
    let paramCount = 1;

    if (role === "patient") {
      sql += ` AND patient_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    } else if (role === "doctor") {
      sql += ` AND doctor_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    } else if (role === "admin" && hospitalId) {
      sql += ` AND hospital_id = $${paramCount}`;
      params.push(hospitalId);
      paramCount++;
    }

    const result = await query(sql, params);
    const row = result.rows[0] || {};

    return {
      all: Number(row.all_count || 0),
      today: Number(row.today_count || 0),
      next7Days: Number(row.next_7_days_count || 0),
    };
  }

  /**
   * Delete appointment (use with caution)
   * NOTE: Consider implementing soft delete pattern instead:
   *   1. Add 'deleted_at' TIMESTAMP column to appointments table
   *   2. Add 'deleted_by' UUID column referencing users table
   *   3. Use UPDATE instead of DELETE: UPDATE appointments SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2
   *   4. Filter out soft-deleted records in queries: WHERE deleted_at IS NULL
   *   5. Benefits: Audit trail, data recovery, compliance with data retention policies
   * 
   * @param {string} id - Appointment UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const sql = `DELETE FROM appointments WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }
}

module.exports = new AppointmentRepository();
