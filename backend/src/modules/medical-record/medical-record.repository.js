const { query } = require("../../config/postgres");

/**
 * Medical Record Repository - PostgreSQL Data Access Layer
 */
const create = async (data) => {
  const recordId = data.recordId || `REC${Date.now()}`;
  const symptoms = data.symptoms ? (Array.isArray(data.symptoms) ? data.symptoms : [data.symptoms]) : [];
  
  const { rows } = await query(
    `INSERT INTO medical_records (
      record_id, patient_id, doctor_id, hospital_id, record_type, title, description,
      diagnosis, symptoms, file_urls, ai_analysis, is_shared, shared_with, record_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      recordId,
      data.patientId,
      data.doctorId,
      data.hospitalId,
      data.recordType,
      data.title,
      data.description,
      data.diagnosis,
      symptoms,
      JSON.stringify(data.fileUrls || data.files || []),
      JSON.stringify(data.aiAnalysis || {}),
      data.isShared || false,
      JSON.stringify(data.sharedWith || []),
      data.date || data.recordDate || new Date()
    ]
  );
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await query(
    `SELECT * FROM medical_records WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findWithFilters = async (filters = {}, options = {}) => {
  const { limit = 50, offset = 0, sort: sortOpt = 'record_date DESC' } = options;

  let sortClause = 'record_date DESC';
  if (typeof sortOpt === 'string') {
    const validSortColumns = ['record_date DESC', 'record_date ASC', 'created_at DESC', 'created_at ASC'];
    sortClause = validSortColumns.includes(sortOpt) ? sortOpt : 'record_date DESC';
  }
  
  let queryText = `SELECT * FROM medical_records WHERE 1=1`;
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
  if (filters.recordType) {
    queryText += ` AND record_type = $${paramIndex}`;
    params.push(filters.recordType);
    paramIndex++;
  }
  if (filters.startDate) {
    queryText += ` AND record_date >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }
  if (filters.endDate) {
    queryText += ` AND record_date <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }

  queryText += ` ORDER BY ${sortClause}`;

  // Add pagination
  queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const { rows } = await query(queryText, params);
  return rows;
};

const count = async (filters = {}) => {
  let queryText = `SELECT COUNT(*) FROM medical_records WHERE 1=1`;
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
  if (filters.recordType) {
    queryText += ` AND record_type = $${paramIndex}`;
    params.push(filters.recordType);
    paramIndex++;
  }
  if (filters.startDate) {
    queryText += ` AND record_date >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }
  if (filters.endDate) {
    queryText += ` AND record_date <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }

  const { rows } = await query(queryText, params);
  return parseInt(rows[0].count, 10);
};

const update = async (id, updateData) => {
  const fields = [];
  const params = [id];
  let paramIndex = 2;

  const allowedFields = {
    title: 'title',
    description: 'description',
    diagnosis: 'diagnosis',
    symptoms: 'symptoms',
    recordType: 'record_type',
    fileUrls: 'file_urls',
    files: 'file_urls',
    aiAnalysis: 'ai_analysis',
    isShared: 'is_shared',
    sharedWith: 'shared_with',
    date: 'record_date',
    recordDate: 'record_date'
  };

  for (const [key, dbField] of Object.entries(allowedFields)) {
    if (updateData[key] !== undefined) {
      fields.push(`${dbField} = $${paramIndex}`);
      
      let val = updateData[key];
      if (dbField === 'file_urls' || dbField === 'shared_with' || dbField === 'ai_analysis') {
        val = JSON.stringify(val);
      }
      
      params.push(val);
      paramIndex++;
    }
  }

  if (fields.length === 0) return findById(id);

  const { rows } = await query(
    `UPDATE medical_records SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rowCount } = await query(
    `DELETE FROM medical_records WHERE id = $1`,
    [id]
  );
  return rowCount > 0;
};

const createAttachment = async (data) => {
  const { medicalRecordId, filename, mimeType, fileSize, fileData } = data;
  const buffer = Buffer.isBuffer(fileData)
    ? fileData
    : (typeof fileData === 'string' && fileData.includes(';base64,')
        ? Buffer.from(fileData.split(';base64,')[1], 'base64')
        : Buffer.from(fileData, 'base64'));

  const { rows } = await query(
    `INSERT INTO attachments (
      medical_record_id, filename, mime_type, file_size, file_data
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id, medical_record_id, filename, mime_type, file_size, created_at`,
    [medicalRecordId, filename, mimeType, fileSize || buffer.length, buffer]
  );
  return rows[0];
};

const findAttachmentById = async (id) => {
  const { rows } = await query(
    `SELECT * FROM attachments WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findAttachmentsByRecordId = async (medicalRecordId) => {
  const { rows } = await query(
    `SELECT id, medical_record_id, filename, mime_type, file_size, created_at 
     FROM attachments 
     WHERE medical_record_id = $1`,
    [medicalRecordId]
  );
  return rows;
};

const deleteAttachment = async (id) => {
  const { rowCount } = await query(
    `DELETE FROM attachments WHERE id = $1`,
    [id]
  );
  return rowCount > 0;
};

module.exports = {
  create,
  findById,
  findWithFilters,
  count,
  update,
  delete: remove,
  createAttachment,
  findAttachmentById,
  findAttachmentsByRecordId,
  deleteAttachment,
};