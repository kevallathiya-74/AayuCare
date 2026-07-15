const { query } = require("../../config/postgres");
const { AppError } = require("../../middleware/errorHandler");
const { mapAppointmentData, mapPaymentData, mapArray } = require("../../utils/fieldMapper");
const { withTransaction } = require("../../utils/transaction");

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
   * Create appointment with payment in transaction
   * @param {Object} appointmentData - Appointment data
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created appointment and payment
   */
  async createWithPayment(appointmentData, paymentData) {
    return withTransaction(async (client) => {
      const appointmentSql = `
        INSERT INTO appointments (appointment_id, patient_id, doctor_id, hospital_id, 
                                 appointment_date, appointment_time, type, symptoms, chief_complaint, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
        RETURNING *
      `;
      const appointmentResult = await client.query(appointmentSql, [
        appointmentData.appointmentId,
        appointmentData.patientId,
        appointmentData.doctorId,
        appointmentData.hospitalId,
        appointmentData.appointmentDate,
        appointmentData.appointmentTime,
        appointmentData.type || "consultation",
        appointmentData.symptoms || [],
        appointmentData.chiefComplaint || null,
      ]);
      const appointment = mapAppointmentData(appointmentResult.rows[0]);

      const paymentSql = `
        INSERT INTO payments (payment_id, appointment_id, patient_id, doctor_id, amount, 
                             currency, payment_method, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *
      `;
      const paymentResult = await client.query(paymentSql, [
        paymentData.paymentId,
        appointment.id,
        appointmentData.patientId,
        appointmentData.doctorId,
        paymentData.amount,
        paymentData.currency || "INR",
        paymentData.paymentMethod || null,
      ]);
      const payment = mapPaymentData(paymentResult.rows[0]);

      return { appointment, payment };
    });
  }

  /**
   * Cancel appointment and refund payment in transaction
   * @param {string} appointmentId - Appointment UUID
   * @param {string} cancelledBy - User UUID who cancelled
   * @param {string} cancellationReason - Reason for cancellation
   * @returns {Promise<Object>} Updated appointment and payment
   */
  async cancelWithRefund(appointmentId, cancelledBy, cancellationReason) {
    return withTransaction(async (client) => {
      const appointmentSql = `
        UPDATE appointments
        SET status = 'cancelled', 
            cancelled_by = $1, 
            cancellation_reason = $2
        WHERE id = $3
        RETURNING *
      `;
      const appointmentResult = await client.query(appointmentSql, [
        cancelledBy,
        cancellationReason,
        appointmentId,
      ]);
      const appointment = appointmentResult.rows[0];
      if (!appointment) throw new Error("Appointment not found");

      const paymentSql = `
        UPDATE payments
        SET status = 'refunded', 
            refunded_at = NOW(),
            refund_amount = amount
        WHERE appointment_id = $1 AND status = 'completed'
        RETURNING *
      `;
      const paymentResult = await client.query(paymentSql, [appointmentId]);
      const payment = paymentResult.rows[0] || null;

      return { appointment, payment };
    });
  }

  /**
   * Complete appointment and mark payment as completed
   * @param {string} appointmentId - Appointment UUID
   * @param {string} notes - Completion notes
   * @returns {Promise<Object>} Updated appointment and payment
   */
  async completeWithPayment(appointmentId, notes = null) {
    return withTransaction(async (client) => {
      const appointmentSql = `
        UPDATE appointments
        SET status = 'completed', notes = COALESCE($1, notes)
        WHERE id = $2
        RETURNING *
      `;
      const appointmentResult = await client.query(appointmentSql, [
        notes,
        appointmentId,
      ]);
      const appointment = appointmentResult.rows[0];
      if (!appointment) throw new Error("Appointment not found");

      const paymentSql = `
        UPDATE payments
        SET status = 'completed', paid_at = NOW()
        WHERE appointment_id = $1 AND status = 'pending'
        RETURNING *
      `;
      const paymentResult = await client.query(paymentSql, [appointmentId]);
      const payment = paymentResult.rows[0] || null;

      return { appointment, payment };
    });
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
      sql += ` AND a.status IN (${statusArray.map((_, i) => `$${paramCount + i}`).join(", ")})`;
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
                   p.user_id as patient_user_id,
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
      sql += ` AND a.status IN (${statusArray.map((_, i) => `$${paramCount + i}`).join(", ")})`;
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
      sql += ` AND a.status IN (${statusArray.map((_, i) => `$${paramCount + i}`).join(", ")})`;
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
    excludeAppointmentId = null,
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
    const {
      hospitalId = null,
      status = null,
      startDate = null,
      endDate = null,
    } = parsedOptions;

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
        0,
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

  /**
   * Count unique patients a doctor has seen (for profile stats)
   */
  async countUniquePatientsForDoctor(doctorId, hospitalId) {
    const sql = `
      SELECT COUNT(DISTINCT patient_id) AS count
      FROM appointments
      WHERE doctor_id = $1
        AND hospital_id = $2
        AND status = 'completed'
    `;
    const result = await query(sql, [doctorId, hospitalId]);
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Count appointments for a doctor at a specific date + time (walk-in slot conflict check)
   */
  async countByDoctorAtTime(
    doctorId,
    hospitalId,
    appointmentDate,
    appointmentTime,
  ) {
    const sql = `
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE doctor_id = $1
        AND hospital_id = $2
        AND appointment_date = $3
        AND appointment_time = $4
        AND status NOT IN ('cancelled', 'completed')
    `;
    const result = await query(sql, [
      doctorId,
      hospitalId,
      appointmentDate,
      appointmentTime,
    ]);
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Count all appointments matching admin-level filters
   */
  async countAll(filters = {}) {
    const { hospitalId, patientId, doctorId, status, startDate, endDate } =
      filters;
    let sql = `SELECT COUNT(*) AS count FROM appointments a WHERE 1=1`;
    const params = [];
    let p = 1;
    if (hospitalId) {
      sql += ` AND a.hospital_id = $${p++}`;
      params.push(hospitalId);
    }
    if (patientId) {
      sql += ` AND a.patient_id = $${p++}`;
      params.push(patientId);
    }
    if (doctorId) {
      sql += ` AND a.doctor_id = $${p++}`;
      params.push(doctorId);
    }
    if (status) {
      const sa = Array.isArray(status)
        ? status
        : String(status)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      sql += ` AND a.status IN (${sa.map((_, i) => `$${p + i}`).join(", ")})`;
      params.push(...sa);
      p += sa.length;
    }
    if (startDate) {
      sql += ` AND a.appointment_date >= $${p++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND a.appointment_date <= $${p++}`;
      params.push(endDate);
    }
    const result = await query(sql, params);
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Count appointments for a specific patient matching filters
   */
  async countByPatient(patientId, filters = {}) {
    const { status, startDate, endDate, doctorId, hospitalId } = filters;
    let sql = `SELECT COUNT(*) AS count FROM appointments a WHERE a.patient_id = $1`;
    const params = [patientId];
    let p = 2;
    if (status) {
      const sa = Array.isArray(status)
        ? status
        : String(status)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      sql += ` AND a.status IN (${sa.map((_, i) => `$${p + i}`).join(", ")})`;
      params.push(...sa);
      p += sa.length;
    }
    if (doctorId) {
      sql += ` AND a.doctor_id = $${p++}`;
      params.push(doctorId);
    }
    if (hospitalId) {
      sql += ` AND a.hospital_id = $${p++}`;
      params.push(hospitalId);
    }
    if (startDate) {
      sql += ` AND a.appointment_date >= $${p++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND a.appointment_date <= $${p++}`;
      params.push(endDate);
    }
    const result = await query(sql, params);
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Count appointments for a specific doctor matching filters
   */
  async countByDoctor(doctorId, filters = {}) {
    const { status, startDate, endDate, patientId, hospitalId } = filters;
    let sql = `SELECT COUNT(*) AS count FROM appointments a WHERE a.doctor_id = $1`;
    const params = [doctorId];
    let p = 2;
    if (status) {
      const sa = Array.isArray(status)
        ? status
        : String(status)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      sql += ` AND a.status IN (${sa.map((_, i) => `$${p + i}`).join(", ")})`;
      params.push(...sa);
      p += sa.length;
    }
    if (patientId) {
      sql += ` AND a.patient_id = $${p++}`;
      params.push(patientId);
    }
    if (hospitalId) {
      sql += ` AND a.hospital_id = $${p++}`;
      params.push(hospitalId);
    }
    if (startDate) {
      sql += ` AND a.appointment_date >= $${p++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND a.appointment_date <= $${p++}`;
      params.push(endDate);
    }
    const result = await query(sql, params);
    return Number(result.rows[0]?.count || 0);
  }
}

module.exports = new AppointmentRepository();
