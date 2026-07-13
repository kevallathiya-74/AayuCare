const { query } = require("../../config/postgres");

const mapEventRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    title: row.title,
    description: row.description,
    eventType: row.event_type,
    type: row.event_type, // Compatibility
    icon: row.icon,
    color: row.color,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    venue: row.venue,
    organizer: row.organizer,
    availableSpots: row.available_spots,
    registeredCount: row.registered_count,
    status: row.status,
    requirements: row.requirements || [],
    benefits: row.benefits || [],
    contactInfo: row.contact_info || {},
    registrations: row.registrations || [],
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const create = async (data) => {
  const { rows } = await query(
    `INSERT INTO events (
      hospital_id, title, description, event_type, icon, color, date, start_time, end_time,
      venue, organizer, available_spots, registered_count, status, requirements, benefits,
      contact_info, registrations, is_active, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *`,
    [
      data.hospitalId,
      data.title,
      data.description || null,
      data.eventType || data.type || "general",
      data.icon || "calendar",
      data.color || "#2196F3",
      data.date,
      data.startTime,
      data.endTime,
      data.venue || null,
      data.organizer || null,
      data.availableSpots || 0,
      0, // registered_count starts at 0
      data.status || "upcoming",
      data.requirements || [],
      data.benefits || [],
      JSON.stringify(data.contactInfo || {}),
      JSON.stringify(data.registrations || []),
      data.isActive !== false,
      data.createdBy || null,
    ],
  );
  return mapEventRow(rows[0]);
};

const findById = async (id) => {
  const { rows } = await query(`SELECT * FROM events WHERE id = $1`, [id]);
  return mapEventRow(rows[0]);
};

const findUpcoming = async (options = {}) => {
  const { limit = 20, offset = 0, hospitalId } = options;
  let queryText = `
    SELECT * FROM events 
    WHERE date >= CURRENT_DATE 
      AND status IN ('upcoming', 'ongoing')
  `;
  const params = [];
  let paramIndex = 1;

  if (hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(hospitalId);
    paramIndex++;
  }

  queryText += ` ORDER BY date ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const { rows } = await query(queryText, params);
  return rows.map(mapEventRow);
};

const findByHospitalId = async (hospitalId, options = {}) => {
  const { limit = 20, offset = 0, sort = "date DESC" } = options;

  // Sort parsing
  let sqlSort = "date DESC";
  if (sort && typeof sort === "object") {
    const keys = Object.keys(sort);
    if (keys.length > 0) {
      const order =
        sort[keys[0]] === -1 ||
        sort[keys[0]] === "desc" ||
        sort[keys[0]] === "DESC"
          ? "DESC"
          : "ASC";
      sqlSort = `${keys[0]} ${order}`;
    }
  }

  const { rows } = await query(
    `SELECT * FROM events WHERE hospital_id = $1 ORDER BY ${sqlSort} LIMIT $2 OFFSET $3`,
    [hospitalId, limit, offset],
  );
  return rows.map(mapEventRow);
};

const findWithFilters = async (filters = {}, options = {}) => {
  const { limit = 20, offset = 0, sort = "date DESC" } = options;
  let queryText = `SELECT * FROM events WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(filters.hospitalId);
    paramIndex++;
  }
  if (filters.status) {
    queryText += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }
  if (filters.startDate) {
    queryText += ` AND date >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }
  if (filters.endDate) {
    queryText += ` AND date <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }

  let sqlSort = "date DESC";
  if (sort) {
    if (typeof sort === "object") {
      const keys = Object.keys(sort);
      if (keys.length > 0) {
        const order =
          sort[keys[0]] === -1 ||
          sort[keys[0]] === "desc" ||
          sort[keys[0]] === "DESC"
            ? "DESC"
            : "ASC";
        sqlSort = `${keys[0]} ${order}`;
      }
    } else if (typeof sort === "string") {
      sqlSort = sort;
    }
  }

  queryText += ` ORDER BY ${sqlSort} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const { rows } = await query(queryText, params);
  return rows.map(mapEventRow);
};

const count = async (filters = {}) => {
  let queryText = `SELECT COUNT(*) FROM events WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(filters.hospitalId);
    paramIndex++;
  }
  if (filters.status) {
    queryText += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  const { rows } = await query(queryText, params);
  return parseInt(rows[0].count, 10);
};

const registerUser = async (eventId, registrationData) => {
  const event = await findById(eventId);
  if (!event) return null;

  const currentRegs = Array.isArray(event.registrations)
    ? event.registrations
    : [];
  // Prevent duplicate registration
  if (currentRegs.some((r) => r.userId === registrationData.userId)) {
    return event;
  }

  const updatedRegs = [...currentRegs, registrationData];
  const newCount = (event.registeredCount || 0) + 1;

  const { rows } = await query(
    `UPDATE events 
     SET registrations = $2, registered_count = $3, updated_at = NOW() 
     WHERE id = $1 
     RETURNING *`,
    [eventId, JSON.stringify(updatedRegs), newCount],
  );
  return mapEventRow(rows[0]);
};

const unregisterUser = async (eventId, userId) => {
  const event = await findById(eventId);
  if (!event) return null;

  const currentRegs = Array.isArray(event.registrations)
    ? event.registrations
    : [];
  const updatedRegs = currentRegs.filter((r) => r.userId !== userId);
  const newCount = Math.max(0, (event.registeredCount || 0) - 1);

  const { rows } = await query(
    `UPDATE events 
     SET registrations = $2, registered_count = $3, updated_at = NOW() 
     WHERE id = $1 
     RETURNING *`,
    [eventId, JSON.stringify(updatedRegs), newCount],
  );
  return mapEventRow(rows[0]);
};

const isUserRegistered = async (eventId, userId) => {
  const event = await findById(eventId);
  if (!event) return false;
  const currentRegs = Array.isArray(event.registrations)
    ? event.registrations
    : [];
  return currentRegs.some((r) => r.userId === userId);
};

const update = async (id, updateData) => {
  const fields = [];
  const params = [id];
  let paramIndex = 2;

  const allowed = {
    title: "title",
    description: "description",
    eventType: "event_type",
    type: "event_type",
    icon: "icon",
    color: "color",
    date: "date",
    startTime: "start_time",
    endTime: "end_time",
    venue: "venue",
    organizer: "organizer",
    availableSpots: "available_spots",
    status: "status",
    requirements: "requirements",
    benefits: "benefits",
    contactInfo: "contact_info",
    isActive: "is_active",
  };

  for (const [key, dbCol] of Object.entries(allowed)) {
    if (updateData[key] !== undefined) {
      fields.push(`${dbCol} = $${paramIndex}`);
      let val = updateData[key];
      if (dbCol === "contact_info") {
        val = JSON.stringify(val);
      }
      params.push(val);
      paramIndex++;
    }
  }

  if (fields.length === 0) return findById(id);

  const { rows } = await query(
    `UPDATE events SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    params,
  );
  return mapEventRow(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await query(`DELETE FROM events WHERE id = $1`, [id]);
  return rowCount > 0;
};

const updateStatus = async (id, status) => {
  const { rows } = await query(
    `UPDATE events SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, status],
  );
  return mapEventRow(rows[0]);
};

const findByDateRange = async (startDate, endDate, options = {}) => {
  const { limit = 50, offset = 0, hospitalId } = options;
  let queryText = `
    SELECT * FROM events 
    WHERE date >= $1 AND date <= $2
  `;
  const params = [startDate, endDate];
  let paramIndex = 3;

  if (hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(hospitalId);
    paramIndex++;
  }

  queryText += ` ORDER BY date ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const { rows } = await query(queryText, params);
  return rows.map(mapEventRow);
};

module.exports = {
  create,
  findById,
  findUpcoming,
  findByHospitalId,
  findWithFilters,
  count,
  registerUser,
  unregisterUser,
  isUserRegistered,
  update,
  delete: remove,
  updateStatus,
  findByDateRange,
};
