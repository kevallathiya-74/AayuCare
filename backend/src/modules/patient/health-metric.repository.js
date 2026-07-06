const { query } = require("../../config/postgres");

const mapMetricRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    patient: row.patient_id,
    patientId: row.patient_id,
    hospitalId: row.hospital_id,
    type: row.metric_type,
    value: row.value,
    unit: row.unit,
    notes: row.notes,
    recordedBy: row.recorded_by,
    source: row.source,
    timestamp: row.recorded_at,
    recordedAt: row.recorded_at,
    createdAt: row.created_at
  };
};

const create = async (data) => {
  const patientId = data.patient || data.patientId;
  const metricType = data.type || data.metricType;
  const recordedAt = data.timestamp || data.recordedAt || new Date();
  
  const { rows } = await query(
    `INSERT INTO health_metrics (
      patient_id, hospital_id, metric_type, value, unit, notes, recorded_by, source, recorded_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      patientId,
      data.hospitalId || "MAIN",
      metricType,
      JSON.stringify(data.value),
      data.unit || null,
      data.notes || null,
      data.recordedBy || null,
      data.source || "manual",
      recordedAt
    ]
  );
  return mapMetricRow(rows[0]);
};

const findById = async (id) => {
  const { rows } = await query(
    `SELECT * FROM health_metrics WHERE id = $1`,
    [id]
  );
  return mapMetricRow(rows[0]);
};

const findWithFilters = async (filters = {}, options = {}) => {
  const { limit = 50, offset = 0, sort = 'recorded_at DESC' } = options;
  
  let queryText = `SELECT * FROM health_metrics WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  const patientId = filters.patient || filters.patientId;
  if (patientId) {
    queryText += ` AND patient_id = $${paramIndex}`;
    params.push(patientId);
    paramIndex++;
  }

  if (filters.hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(filters.hospitalId);
    paramIndex++;
  }

  const metricType = filters.type || filters.metricType || filters.metric_type;
  if (metricType) {
    queryText += ` AND metric_type = $${paramIndex}`;
    params.push(metricType);
    paramIndex++;
  }

  const recordedAtFilter = filters.recordedAt || filters.recorded_at || filters.timestamp;
  if (recordedAtFilter) {
    if (recordedAtFilter.$gte) {
      queryText += ` AND recorded_at >= $${paramIndex}`;
      params.push(recordedAtFilter.$gte);
      paramIndex++;
    }
    if (recordedAtFilter.$lte) {
      queryText += ` AND recorded_at <= $${paramIndex}`;
      params.push(recordedAtFilter.$lte);
      paramIndex++;
    }
    if (recordedAtFilter.$lt) {
      queryText += ` AND recorded_at < $${paramIndex}`;
      params.push(recordedAtFilter.$lt);
      paramIndex++;
    }
    if (recordedAtFilter.$gt) {
      queryText += ` AND recorded_at > $${paramIndex}`;
      params.push(recordedAtFilter.$gt);
      paramIndex++;
    }
  }

  // Handle sorting translation
  let sqlSort = 'recorded_at DESC';
  if (sort) {
    if (typeof sort === 'object') {
      const keys = Object.keys(sort);
      if (keys.length > 0) {
        const order = sort[keys[0]] === -1 || sort[keys[0]] === 'desc' || sort[keys[0]] === 'DESC' ? 'DESC' : 'ASC';
        const field = keys[0] === 'timestamp' || keys[0] === 'recordedAt' ? 'recorded_at' : keys[0];
        sqlSort = `${field} ${order}`;
      }
    } else if (typeof sort === 'string') {
      sqlSort = sort.replace('timestamp', 'recorded_at').replace('recordedAt', 'recorded_at');
    }
  }

  queryText += ` ORDER BY ${sqlSort} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const { rows } = await query(queryText, params);
  return rows.map(mapMetricRow);
};

const findByPatientId = async (patientId, options = {}) => {
  return findWithFilters({ patient: patientId }, options);
};

const findByType = async (patientId, type, options = {}) => {
  return findWithFilters({ patient: patientId, type }, options);
};

const count = async (filters = {}) => {
  let queryText = `SELECT COUNT(*) FROM health_metrics WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  const patientId = filters.patient || filters.patientId;
  if (patientId) {
    queryText += ` AND patient_id = $${paramIndex}`;
    params.push(patientId);
    paramIndex++;
  }

  if (filters.hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(filters.hospitalId);
    paramIndex++;
  }

  const metricType = filters.type || filters.metricType;
  if (metricType) {
    queryText += ` AND metric_type = $${paramIndex}`;
    params.push(metricType);
    paramIndex++;
  }

  const { rows } = await query(queryText, params);
  return parseInt(rows[0].count, 10);
};

const update = async (id, updateData) => {
  const fields = [];
  const params = [id];
  let paramIndex = 2;

  const allowed = {
    value: 'value',
    unit: 'unit',
    notes: 'notes',
    source: 'source',
    timestamp: 'recorded_at',
    recordedAt: 'recorded_at'
  };

  for (const [key, dbCol] of Object.entries(allowed)) {
    if (updateData[key] !== undefined) {
      fields.push(`${dbCol} = $${paramIndex}`);
      params.push(dbCol === 'value' ? JSON.stringify(updateData[key]) : updateData[key]);
      paramIndex++;
    }
  }

  if (fields.length === 0) return findById(id);

  const { rows } = await query(
    `UPDATE health_metrics SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return mapMetricRow(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await query(
    `DELETE FROM health_metrics WHERE id = $1`,
    [id]
  );
  return rowCount > 0;
};

const deleteOldMetrics = async (beforeDate) => {
  const { rowCount } = await query(
    `DELETE FROM health_metrics WHERE recorded_at < $1`,
    [beforeDate]
  );
  return { deletedCount: rowCount };
};

const getLatestMetrics = async (patientId, metricTypes = []) => {
  let queryText = `
    SELECT DISTINCT ON (metric_type) * 
    FROM health_metrics 
    WHERE patient_id = $1
  `;
  const params = [patientId];
  
  if (metricTypes.length > 0) {
    queryText += ` AND metric_type = ANY($2)`;
    params.push(metricTypes);
  }
  
  queryText += ` ORDER BY metric_type, recorded_at DESC`;
  
  const { rows } = await query(queryText, params);
  return rows.map(mapMetricRow);
};

const getTodayMetrics = async (patientId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { rows } = await query(
    `SELECT * FROM health_metrics 
     WHERE patient_id = $1 AND recorded_at >= $2 AND recorded_at < $3 
     ORDER BY recorded_at DESC LIMIT 500`,
    [patientId, today, tomorrow]
  );
  return rows.map(mapMetricRow);
};

const findTodayMetrics = async (patientId, metricTypes = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let queryText = `SELECT * FROM health_metrics WHERE patient_id = $1 AND recorded_at >= $2 AND recorded_at < $3`;
  const params = [patientId, today, tomorrow];
  const paramIndex = 4;

  if (metricTypes.length > 0) {
    queryText += ` AND metric_type = ANY($${paramIndex})`;
    params.push(metricTypes);
  }

  queryText += ` ORDER BY recorded_at DESC LIMIT 500`;

  const { rows } = await query(queryText, params);
  return rows.map(mapMetricRow);
};

const getMetricStats = async (patientId, type, startDate, endDate) => {
  const { rows } = await query(
    `SELECT 
      AVG((value->>0)::numeric) as avg,
      MIN((value->>0)::numeric) as min,
      MAX((value->>0)::numeric) as max,
      COUNT(*) as count
     FROM health_metrics
     WHERE patient_id = $1 AND metric_type = $2 AND recorded_at >= $3 AND recorded_at <= $4`,
    [patientId, type, startDate, endDate]
  );
  
  if (!rows[0] || rows[0].count === '0') return null;
  
  const latestResult = await query(
    `SELECT value FROM health_metrics WHERE patient_id = $1 AND metric_type = $2 AND recorded_at >= $3 AND recorded_at <= $4 ORDER BY recorded_at DESC LIMIT 1`,
    [patientId, type, startDate, endDate]
  );
  const oldestResult = await query(
    `SELECT value FROM health_metrics WHERE patient_id = $1 AND metric_type = $2 AND recorded_at >= $3 AND recorded_at <= $4 ORDER BY recorded_at ASC LIMIT 1`,
    [patientId, type, startDate, endDate]
  );

  return {
    avg: parseFloat(rows[0].avg),
    min: parseFloat(rows[0].min),
    max: parseFloat(rows[0].max),
    count: parseInt(rows[0].count, 10),
    latest: latestResult.rows[0]?.value,
    oldest: oldestResult.rows[0]?.value
  };
};

module.exports = {
  create,
  findById,
  findWithFilters,
  findByPatientId,
  findByType,
  count,
  update,
  delete: remove,
  deleteOldMetrics,
  getLatestMetrics,
  getTodayMetrics,
  findTodayMetrics,
  getMetricStats,
};
