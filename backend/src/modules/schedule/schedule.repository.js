const { query } = require("../../config/postgres");
const logger = require("../../utils/logger");

const DAYS_MAP = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  0: 'monday', // Fallback defaults
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  7: 'sunday'
};

// Map day string to integer (e.g. monday -> 1)
const getDayNum = (day) => {
  if (day === undefined || day === null) return 1;
  if (typeof day === 'number') return day;
  const normalized = String(day).trim().toLowerCase();
  return DAYS_MAP[normalized] !== undefined ? DAYS_MAP[normalized] : 1;
};

// Map day integer back to string
const getDayStr = (num) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[num] || 'monday';
};

const generateTimeSlots = (startTimeStr, endTimeStr, durationMin) => {
  const slots = [];
  if (!startTimeStr || !endTimeStr || !durationMin) return slots;
  
  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);
  
  let currentMin = startH * 60 + startM;
  const endTotalMin = endH * 60 + endM;
  
  let index = 1;
  while (currentMin + durationMin <= endTotalMin) {
    const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
    const m = (currentMin % 60).toString().padStart(2, '0');
    slots.push({
      _id: `slot_${index}`,
      time: `${h}:${m}`,
      isAvailable: true
    });
    currentMin += durationMin;
    index++;
  }
  return slots;
};

const mapScheduleRow = (row) => {
  if (!row) return null;
  
  // Format TIME (e.g., '09:00:00' to '09:00')
  const startTime = String(row.start_time).substring(0, 5);
  const endTime = String(row.end_time).substring(0, 5);
  const duration = row.slot_duration_minutes || 15;
  
  return {
    id: row.id,
    _id: row.id, // For backward compatibility
    doctorId: row.doctor_id,
    hospitalId: row.hospital_id,
    dayOfWeek: getDayStr(row.day_of_week),
    startTime,
    endTime,
    slotDurationMinutes: duration,
    isAvailable: row.is_available,
    maxPatients: row.max_patients,
    timeSlots: generateTimeSlots(startTime, endTime, duration),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const create = async (data) => {
  const dayNum = getDayNum(data.dayOfWeek);
  const duration = data.slotDurationMinutes || data.slotDuration || 15;
  const maxPatients = data.maxPatients || 20;

  const { rows } = await query(
    `INSERT INTO schedules (
      doctor_id, hospital_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available, max_patients
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (doctor_id, hospital_id, day_of_week, start_time)
    DO UPDATE SET
      end_time = EXCLUDED.end_time,
      slot_duration_minutes = EXCLUDED.slot_duration_minutes,
      is_available = EXCLUDED.is_available,
      max_patients = EXCLUDED.max_patients,
      updated_at = NOW()
    RETURNING *`,
    [
      data.doctorId,
      data.hospitalId,
      dayNum,
      data.startTime,
      data.endTime,
      duration,
      data.isAvailable !== false,
      maxPatients
    ]
  );
  return mapScheduleRow(rows[0]);
};

const findById = async (id) => {
  const { rows } = await query(
    `SELECT * FROM schedules WHERE id = $1`,
    [id]
  );
  return mapScheduleRow(rows[0]);
};

const findByDoctorAndDay = async (doctorId, dayOfWeek) => {
  const dayNum = getDayNum(dayOfWeek);
  const { rows } = await query(
    `SELECT * FROM schedules WHERE doctor_id = $1 AND day_of_week = $2`,
    [doctorId, dayNum]
  );
  return mapScheduleRow(rows[0]);
};

const findByDoctor = async (doctorId, hospitalId = null) => {
  let queryText = `SELECT * FROM schedules WHERE doctor_id = $1`;
  const params = [doctorId];

  if (hospitalId) {
    queryText += ` AND hospital_id = $2`;
    params.push(hospitalId);
  }

  queryText += ` ORDER BY day_of_week ASC, start_time ASC`;

  const { rows } = await query(queryText, params);
  return rows.map(mapScheduleRow);
};

const findAvailableByDoctor = async (doctorId, hospitalId = null) => {
  let queryText = `SELECT * FROM schedules WHERE doctor_id = $1 AND is_available = true`;
  const params = [doctorId];

  if (hospitalId) {
    queryText += ` AND hospital_id = $2`;
    params.push(hospitalId);
  }

  queryText += ` ORDER BY day_of_week ASC, start_time ASC`;

  const { rows } = await query(queryText, params);
  return rows.map(mapScheduleRow);
};

const update = async (id, updates) => {
  const fields = [];
  const params = [id];
  let paramIndex = 2;

  const allowed = {
    startTime: 'start_time',
    endTime: 'end_time',
    slotDurationMinutes: 'slot_duration_minutes',
    slotDuration: 'slot_duration_minutes',
    isAvailable: 'is_available',
    maxPatients: 'max_patients'
  };

  for (const [key, dbCol] of Object.entries(allowed)) {
    if (updates[key] !== undefined) {
      fields.push(`${dbCol} = $${paramIndex}`);
      params.push(updates[key]);
      paramIndex++;
    }
  }

  if (updates.dayOfWeek !== undefined) {
    fields.push(`day_of_week = $${paramIndex}`);
    params.push(getDayNum(updates.dayOfWeek));
    paramIndex++;
  }

  if (fields.length === 0) return await findById(id);

  const { rows } = await query(
    `UPDATE schedules SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    params
  );
  return mapScheduleRow(rows[0]);
};

const updateByDoctorAndDay = async (doctorId, dayOfWeek, updates) => {
  const dayNum = getDayNum(dayOfWeek);
  const existing = await findByDoctorAndDay(doctorId, dayOfWeek);
  
  if (existing) {
    return await update(existing.id, updates);
  } else {
    // Create new
    return await create({
      doctorId,
      dayOfWeek,
      hospitalId: updates.hospitalId || "MAIN",
      startTime: updates.startTime || "09:00",
      endTime: updates.endTime || "17:00",
      slotDurationMinutes: updates.slotDurationMinutes || 15,
      isAvailable: updates.isAvailable !== false,
      maxPatients: updates.maxPatients || 20
    });
  }
};

const remove = async (id) => {
  const { rowCount } = await query(
    `DELETE FROM schedules WHERE id = $1`,
    [id]
  );
  return rowCount > 0;
};

const deleteByDoctor = async (doctorId) => {
  const { rowCount } = await query(
    `DELETE FROM schedules WHERE doctor_id = $1`,
    [doctorId]
  );
  return rowCount;
};

const bulkCreate = async (doctorId, schedules) => {
  const created = [];
  for (const s of schedules) {
    created.push(await create({ ...s, doctorId }));
  }
  return created;
};

const getAvailableTimeSlots = async (doctorId, dayOfWeek, hospitalId = null) => {
  const schedule = await findByDoctorAndDay(doctorId, dayOfWeek);
  if (!schedule || !schedule.isAvailable) return [];
  return schedule.timeSlots;
};

const isDoctorAvailable = async (doctorId, dayOfWeek) => {
  const schedule = await findByDoctorAndDay(doctorId, dayOfWeek);
  return !!(schedule && schedule.isAvailable);
};

const count = async (filters = {}) => {
  let queryText = `SELECT COUNT(*) FROM schedules WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

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

  const { rows } = await query(queryText, params);
  return parseInt(rows[0].count, 10);
};

module.exports = {
  create,
  findById,
  findByDoctorAndDay,
  findByDoctor,
  findAvailableByDoctor,
  update,
  updateByDoctorAndDay,
  delete: remove,
  deleteByDoctor,
  bulkCreate,
  getAvailableTimeSlots,
  isDoctorAvailable,
  count,
};