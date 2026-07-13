const { query } = require("../../config/postgres");

/**
 * Prescription Repository - PostgreSQL Data Access Layer
 */
const create = async (data) => {
  const prescriptionId = data.prescriptionId || `PRSC${Date.now()}`;
  const { rows } = await query(
    `INSERT INTO prescriptions (
      prescription_id, appointment_id, patient_id, doctor_id, hospital_id,
      diagnosis, chief_complaint, medications, instructions, follow_up_date, pharmacy_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      prescriptionId,
      data.appointmentId || null,
      data.patientId,
      data.doctorId,
      data.hospitalId,
      data.diagnosis,
      data.chiefComplaint,
      JSON.stringify(data.medications || []),
      data.instructions,
      data.followUpDate || null,
      data.pharmacyStatus || "pending",
    ],
  );
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await query(`SELECT * FROM prescriptions WHERE id = $1`, [
    id,
  ]);
  return rows[0] || null;
};

const findByPrescriptionId = async (prescriptionId) => {
  const { rows } = await query(
    `SELECT * FROM prescriptions WHERE prescription_id = $1`,
    [prescriptionId],
  );
  return rows[0] || null;
};

const findByPatientId = async (patientId, options = {}) => {
  const { limit = 50, offset = 0 } = options;
  const { rows } = await query(
    `SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [patientId, limit, offset],
  );
  return rows;
};

const findByDoctorId = async (doctorId, options = {}) => {
  const { limit = 50, offset = 0 } = options;
  const { rows } = await query(
    `SELECT * FROM prescriptions WHERE doctor_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [doctorId, limit, offset],
  );
  return rows;
};

const findWithFilters = async (filters = {}, options = {}) => {
  const { limit = 50, offset = 0 } = options;
  let queryText = `SELECT * FROM prescriptions WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.patientId) {
    queryText += ` AND patient_id = $${paramIndex}`;
    params.push(filters.patientId);
    paramIndex++;
  }
  if (filters.doctorId) {
    queryText += ` AND doctor_id = $${paramIndex}`;
    params.push(filters.doctorId);
    paramIndex++;
  }
  if (filters.hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(filters.hospitalId);
    paramIndex++;
  }
  if (filters.prescriptionId) {
    queryText += ` AND prescription_id = $${paramIndex}`;
    params.push(filters.prescriptionId);
    paramIndex++;
  }
  if (filters.pharmacyStatus || filters.status) {
    queryText += ` AND pharmacy_status = $${paramIndex}`;
    params.push(filters.pharmacyStatus || filters.status);
    paramIndex++;
  }
  if (filters.startDate) {
    queryText += ` AND created_at >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }
  if (filters.endDate) {
    queryText += ` AND created_at <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }

  queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const { rows } = await query(queryText, params);
  return rows;
};

const count = async (filters = {}) => {
  let queryText = `SELECT COUNT(*) FROM prescriptions WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.patientId) {
    queryText += ` AND patient_id = $${paramIndex}`;
    params.push(filters.patientId);
    paramIndex++;
  }
  if (filters.doctorId) {
    queryText += ` AND doctor_id = $${paramIndex}`;
    params.push(filters.doctorId);
    paramIndex++;
  }
  if (filters.hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(filters.hospitalId);
    paramIndex++;
  }
  if (filters.pharmacyStatus || filters.status) {
    queryText += ` AND pharmacy_status = $${paramIndex}`;
    params.push(filters.pharmacyStatus || filters.status);
    paramIndex++;
  }
  if (filters.startDate) {
    queryText += ` AND created_at >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }
  if (filters.endDate) {
    queryText += ` AND created_at <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }

  const { rows } = await query(queryText, params);
  return parseInt(rows[0].count, 10);
};

const update = async (id, updates) => {
  const fields = [];
  const params = [id];
  let paramIndex = 2;

  const allowed = [
    "diagnosis",
    "chiefComplaint",
    "medications",
    "instructions",
    "followUpDate",
    "isActive",
  ];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      const dbCol = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      fields.push(`${dbCol} = $${paramIndex}`);
      params.push(
        key === "medications" ? JSON.stringify(updates[key]) : updates[key],
      );
      paramIndex++;
    }
  }

  if (fields.length === 0) return findById(id);

  const { rows } = await query(
    `UPDATE prescriptions SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    params,
  );
  return rows[0] || null;
};

const updatePharmacyStatus = async (id, status) => {
  const { rows } = await query(
    `UPDATE prescriptions SET pharmacy_status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, status],
  );
  return rows[0] || null;
};

const getPharmacyStatusCounts = async (filters = {}) => {
  let queryText = `SELECT pharmacy_status AS status, COUNT(*) as count FROM prescriptions WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(filters.hospitalId);
    paramIndex++;
  }

  queryText += ` GROUP BY pharmacy_status`;
  const { rows } = await query(queryText, params);
  return rows;
};

const remove = async (id) => {
  const { rowCount } = await query(`DELETE FROM prescriptions WHERE id = $1`, [
    id,
  ]);
  return rowCount > 0;
};

module.exports = {
  create,
  findById,
  findByPrescriptionId,
  findByPatientId,
  findByPatient: findByPatientId,
  findByDoctorId,
  findWithFilters,
  count,
  update,
  updatePharmacyStatus,
  getPharmacyStatusCounts,
  delete: remove,
};
