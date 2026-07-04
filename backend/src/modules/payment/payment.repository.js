const { query } = require("../../config/postgres");
const { AppError } = require("../../middleware/errorHandler");

/**
 * Payment Repository - PostgreSQL data access layer
 */
/**
 * Build the WHERE clause and parameter list shared by `findByPatient`
 * and `countByPatient`. Returns { whereClause, params } where the WHERE
 * clause is a leading-AND-friendly string (or empty) and params is the
 * matching array of bound values.
 */
const buildPatientFiltersWhere = (patientId, filters = {}) => {
  const where = [`p.patient_id = $1`];
  const params = [patientId];
  let idx = 2;

  if (filters.status) {
    where.push(`p.status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters.startDate) {
    where.push(`p.created_at >= $${idx++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    where.push(`p.created_at <= $${idx++}`);
    params.push(filters.endDate);
  }

  return { whereClause: `WHERE ${where.join(" AND ")}`, params };
};

class PaymentRepository {
  /**
   * Create payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment
   */
  async create(paymentData) {
    const {
      paymentId,
      appointmentId,
      patientId,
      doctorId,
      amount,
      currency = "INR",
      paymentMethod,
    } = paymentData;

    const sql = `
            INSERT INTO payments (payment_id, appointment_id, patient_id, doctor_id, amount, 
                                 currency, payment_method, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING id, payment_id, appointment_id, patient_id, doctor_id, amount, currency,
                      status, payment_method, created_at, updated_at
        `;

    const result = await query(sql, [
      paymentId,
      appointmentId,
      patientId,
      doctorId,
      amount,
      currency,
      paymentMethod || null,
    ]);

    return result.rows[0];
  }

  /**
   * Find payment by ID
   * @param {string} id - Payment UUID
   * @returns {Promise<Object|null>} Payment object or null
   */
  async findById(id) {
    const sql = `
            SELECT p.*, 
                   a.appointment_date, a.appointment_time,
                   pat.name as patient_name, pat.email as patient_email,
                   doc.name as doctor_name, doc.email as doctor_email
            FROM payments p
            LEFT JOIN appointments a ON p.appointment_id = a.id
            LEFT JOIN users pat ON p.patient_id = pat.id
            LEFT JOIN users doc ON p.doctor_id = doc.id
            WHERE p.id = $1
        `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find payment by appointment ID
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise<Object|null>} Payment object or null
   */
  async findByAppointmentId(appointmentId) {
    const sql = `
            SELECT * FROM payments
            WHERE appointment_id = $1
            LIMIT 1
        `;

    const result = await query(sql, [appointmentId]);
    return result.rows[0] || null;
  }

  /**
   * Find payments by patient
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of payments
   */
  async findByPatient(patientId, filters = {}) {
    const { limit = 20, offset = 0 } = filters;
    const { whereClause, params } = buildPatientFiltersWhere(patientId, filters);

    const sql = `
            SELECT p.*,
                   a.appointment_date, a.appointment_time,
                   d.name as doctor_name,
                   doc.specialization
            FROM payments p
            LEFT JOIN appointments a ON p.appointment_id = a.id
            LEFT JOIN users d ON p.doctor_id = d.id
            LEFT JOIN doctors doc ON d.id = doc.user_id
            ${whereClause}
        `;

    params.push(limit, offset);

    const result = await query(
      `${sql} ORDER BY p.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return result.rows;
  }

  /**
   * Count payments matching the same filter set as `findByPatient`.
   * Returned for accurate pagination `total` (page size != total records).
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Filter options (status, startDate, endDate)
   * @returns {Promise<number>} Total matching payment count
   */
  async countByPatient(patientId, filters = {}) {
    const { whereClause, params } = buildPatientFiltersWhere(patientId, filters);
    const sql = `
            SELECT COUNT(*) AS total
            FROM payments p
            ${whereClause}
        `;
    const result = await query(sql, params);
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Update payment
   * @param {string} id - Payment UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated payment
   */
  async update(id, updates) {
    const allowedFields = [
      "status",
      "payment_method",
      "transaction_id",
      "payment_gateway",
      "paid_at",
      "refunded_at",
      "refund_amount",
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
            UPDATE payments
            SET ${updateFields.join(", ")}
            WHERE id = $${paramCount}
            RETURNING id, payment_id, appointment_id, patient_id, doctor_id, amount, currency,
                      status, payment_method, transaction_id, payment_gateway, paid_at,
                      refunded_at, refund_amount, created_at, updated_at
        `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Get payment statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Payment statistics
   */
  async getStatistics(filters = {}) {
    const { hospitalId, doctorId, startDate, endDate } = filters;

    let sql = `
            SELECT 
                COUNT(*) as total_payments,
              SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
              SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_amount,
              AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) as average_payment
            FROM payments p
            LEFT JOIN appointments a ON p.appointment_id = a.id
            WHERE 1=1
        `;

    const params = [];
    let paramCount = 1;

    if (hospitalId) {
      sql += ` AND a.hospital_id = $${paramCount}`;
      params.push(hospitalId);
      paramCount++;
    }

    if (doctorId) {
      sql += ` AND p.doctor_id = $${paramCount}`;
      params.push(doctorId);
      paramCount++;
    }

    if (startDate) {
      sql += ` AND p.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND p.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    const result = await query(sql, params);
    return result.rows[0];
  }
}

module.exports = new PaymentRepository();
