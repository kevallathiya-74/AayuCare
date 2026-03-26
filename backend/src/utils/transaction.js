const { getClient } = require("../config/postgres");
const logger = require("./logger");

/**
 * PostgreSQL Transaction Helper
 * Provides transaction wrapper for ACID-compliant operations
 */

/**
 * Execute operations within a transaction
 * Automatically commits on success, rolls back on error
 *
 * @param {Function} callback - Async function that receives client and executes queries
 * @returns {Promise<any>} Result from callback
 *
 * @example
 * await withTransaction(async (client) => {
 *   const user = await client.query('INSERT INTO users ...');
 *   const patient = await client.query('INSERT INTO patients ...');
 *   return { user, patient };
 * });
 */
const withTransaction = async (callback) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");
    logger.debug("Transaction BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");
    logger.debug("Transaction COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Transaction ROLLBACK:", error.message);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Create appointment with payment in transaction
 * Ensures both are created or neither is created
 *
 * @param {Object} appointmentData - Appointment data
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Created appointment and payment
 */
const createAppointmentWithPayment = async (appointmentData, paymentData) => {
  return await withTransaction(async (client) => {
    // Insert appointment
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

    const appointment = appointmentResult.rows[0];

    // Insert payment
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

    const payment = paymentResult.rows[0];

    return { appointment, payment };
  });
};

/**
 * Cancel appointment and refund payment in transaction
 *
 * @param {string} appointmentId - Appointment UUID
 * @param {string} cancelledBy - User UUID who cancelled
 * @param {string} cancellationReason - Reason for cancellation
 * @returns {Promise<Object>} Updated appointment and payment
 */
const cancelAppointmentWithRefund = async (
  appointmentId,
  cancelledBy,
  cancellationReason
) => {
  return await withTransaction(async (client) => {
    // Update appointment status
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

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Update payment to refunded
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
};

/**
 * Complete appointment and mark payment as completed
 *
 * @param {string} appointmentId - Appointment UUID
 * @param {string} notes - Completion notes
 * @returns {Promise<Object>} Updated appointment and payment
 */
const completeAppointmentWithPayment = async (appointmentId, notes = null) => {
  return await withTransaction(async (client) => {
    // Update appointment status
    const appointmentSql = `
            UPDATE appointments
            SET status = 'completed', notes = $1
            WHERE id = $2
            RETURNING *
        `;

    const appointmentResult = await client.query(appointmentSql, [
      notes,
      appointmentId,
    ]);
    const appointment = appointmentResult.rows[0];

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Mark payment as completed
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
};

/**
 * Create user with role-specific profile in transaction
 *
 * @param {Object} userData - User data
 * @param {Object} roleData - Doctor or Patient specific data
 * @returns {Promise<Object>} Created user and profile
 */
const createUserWithProfile = async (userData, roleData) => {
  return await withTransaction(async (client) => {
    // Insert user
    const userSql = `
            INSERT INTO users (user_id, name, email, phone, password_hash, role, hospital_id, hospital_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, user_id, name, email, phone, role, hospital_id, hospital_name, created_at
        `;

    const userResult = await client.query(userSql, [
      userData.userId,
      userData.name,
      userData.email,
      userData.phone,
      userData.passwordHash,
      userData.role,
      userData.hospitalId,
      userData.hospitalName || null,
    ]);

    const user = userResult.rows[0];

    let profile = null;

    // Create role-specific profile
    if (userData.role === "doctor") {
      const doctorSql = `
                INSERT INTO doctors (user_id, specialization, qualification, experience, consultation_fee)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

      const doctorResult = await client.query(doctorSql, [
        user.id,
        roleData.specialization,
        roleData.qualification,
        roleData.experience,
        roleData.consultationFee,
      ]);

      profile = doctorResult.rows[0];
    } else if (userData.role === "patient") {
      const patientSql = `
                INSERT INTO patients (user_id, date_of_birth, gender, blood_group)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;

      const patientResult = await client.query(patientSql, [
        user.id,
        roleData.dateOfBirth || null,
        roleData.gender || null,
        roleData.bloodGroup || null,
      ]);

      profile = patientResult.rows[0];
    }

    return { user, profile };
  });
};

module.exports = {
  withTransaction,
  createAppointmentWithPayment,
  cancelAppointmentWithRefund,
  completeAppointmentWithPayment,
  createUserWithProfile,
};
