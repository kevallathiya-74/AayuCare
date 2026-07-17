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
            RETURNING id, payment_id AS "paymentId", appointment_id AS "appointmentId", patient_id AS "patientId", doctor_id AS "doctorId", amount, currency,
                      status, payment_method AS "paymentMethod", created_at AS "createdAt", updated_at AS "updatedAt"
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

    return result.rows[0] || null;
  }

  /**
   * Find payment by ID
   * @param {string} id - Payment UUID
   * @returns {Promise<Object|null>} Payment object or null
   */
  async findById(id) {
    const sql = `
            SELECT p.id,
                   p.payment_id AS "paymentId",
                   p.appointment_id AS "appointmentId",
                   p.patient_id AS "patientId",
                   p.doctor_id AS "doctorId",
                   p.amount,
                   p.currency,
                   p.payment_method AS "paymentMethod",
                   p.transaction_id AS "transactionId",
                   p.payment_gateway AS "paymentGateway",
                   p.status,
                   p.paid_at AS "paidAt",
                   p.refunded_at AS "refundedAt",
                   p.refund_amount AS "refundAmount",
                   p.created_at AS "createdAt",
                   p.updated_at AS "updatedAt",
                   a.appointment_date AS "appointmentDate", a.appointment_time AS "appointmentTime",
                   pat.name as "patientName", pat.email as "patientEmail",
                   doc.name as "doctorName", doc.email as "doctorEmail"
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
            SELECT p.id, p.payment_id AS "paymentId", p.appointment_id AS "appointmentId", p.patient_id AS "patientId",
                   p.doctor_id AS "doctorId", p.amount, p.currency, p.payment_method AS "paymentMethod",
                   p.transaction_id AS "transactionId", p.payment_gateway AS "paymentGateway", p.status, p.paid_at AS "paidAt",
                   p.refunded_at AS "refundedAt", p.refund_amount AS "refundAmount", p.created_at AS "createdAt", p.updated_at AS "updatedAt"
            FROM payments p
            WHERE p.appointment_id = $1
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
    const { whereClause, params } = buildPatientFiltersWhere(
      patientId,
      filters,
    );

    const sql = `
            SELECT p.id,
                   p.payment_id AS "paymentId",
                   p.appointment_id AS "appointmentId",
                   p.patient_id AS "patientId",
                   p.doctor_id AS "doctorId",
                   p.amount,
                   p.currency,
                   p.payment_method AS "paymentMethod",
                   p.transaction_id AS "transactionId",
                   p.payment_gateway AS "paymentGateway",
                   p.status,
                   p.paid_at AS "paidAt",
                   p.refunded_at AS "refundedAt",
                   p.refund_amount AS "refundAmount",
                   p.created_at AS "createdAt",
                   p.updated_at AS "updatedAt",
                   a.appointment_date AS "appointmentDate", a.appointment_time AS "appointmentTime",
                   d.name as "doctorName",
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
      params,
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
    const { whereClause, params } = buildPatientFiltersWhere(
      patientId,
      filters,
    );
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
            RETURNING id, payment_id AS "paymentId", appointment_id AS "appointmentId", patient_id AS "patientId", doctor_id AS "doctorId", amount, currency,
                      status, payment_method AS "paymentMethod", transaction_id AS "transactionId", payment_gateway AS "paymentGateway", paid_at AS "paidAt",
                      refunded_at AS "refundedAt", refund_amount AS "refundAmount", created_at AS "createdAt", updated_at AS "updatedAt"
        `;

    const result = await query(sql, values);
    return result.rows[0] || null;
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
                COUNT(*) as "totalPayments",
              SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as "totalRevenue",
              SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as "pendingAmount",
              AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) as "averagePayment"
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
    return result.rows[0] || null;
  }
}

module.exports = new PaymentRepository();
