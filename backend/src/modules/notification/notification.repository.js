const { query } = require("../../config/postgres");
const logger = require("../../utils/logger");

const mapNotificationRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    hospitalId: row.hospital_id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data || {},
    read: row.is_read,
    readAt: row.read_at,
    sentAt: row.sent_at,
    createdAt: row.created_at
  };
};

const create = async (data) => {
  const { rows } = await query(
    `INSERT INTO notifications (
      user_id, hospital_id, type, title, body, data, is_read, sent_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *`,
    [
      data.userId,
      data.hospitalId || "MAIN",
      data.type,
      data.title,
      data.body,
      JSON.stringify(data.data || {}),
      data.read || false
    ]
  );
  return mapNotificationRow(rows[0]);
};

const createBulk = async (arr) => {
  const created = [];
  for (const item of arr) {
    created.push(await create(item));
  }
  return created;
};

const findById = async (id) => {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE id = $1`,
    [id]
  );
  return mapNotificationRow(rows[0]);
};

const findByUserId = async (userId, options = {}) => {
  const { limit = 50, offset = 0, unreadOnly = false } = options;
  
  let queryText = `SELECT * FROM notifications WHERE user_id = $1`;
  const params = [userId];
  
  if (unreadOnly) {
    queryText += ` AND is_read = false`;
  }
  
  queryText += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
  params.push(limit, offset);
  
  const { rows } = await query(queryText, params);
  return rows.map(mapNotificationRow);
};

const findWithFilters = async (filters = {}, options = {}) => {
  const { limit = 50, offset = 0 } = options;
  let queryText = `SELECT * FROM notifications WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.userId) {
    queryText += ` AND user_id = $${paramIndex}`;
    params.push(filters.userId);
    paramIndex++;
  }
  if (filters.hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(filters.hospitalId);
    paramIndex++;
  }
  if (filters.type) {
    queryText += ` AND type = $${paramIndex}`;
    params.push(filters.type);
    paramIndex++;
  }
  if (filters.read !== undefined) {
    queryText += ` AND is_read = $${paramIndex}`;
    params.push(filters.read);
    paramIndex++;
  }

  queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const { rows } = await query(queryText, params);
  return rows.map(mapNotificationRow);
};

const count = async (filters = {}) => {
  let queryText = `SELECT COUNT(*) FROM notifications WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.userId) {
    queryText += ` AND user_id = $${paramIndex}`;
    params.push(filters.userId);
    paramIndex++;
  }
  if (filters.hospitalId) {
    queryText += ` AND hospital_id = $${paramIndex}`;
    params.push(filters.hospitalId);
    paramIndex++;
  }
  if (filters.type) {
    queryText += ` AND type = $${paramIndex}`;
    params.push(filters.type);
    paramIndex++;
  }
  if (filters.read !== undefined) {
    queryText += ` AND is_read = $${paramIndex}`;
    params.push(filters.read);
    paramIndex++;
  }

  const { rows } = await query(queryText, params);
  return parseInt(rows[0].count, 10);
};

const getUnreadCount = async (userId) => {
  const { rows } = await query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return parseInt(rows[0].count, 10);
};

const markAsRead = async (id, userId) => {
  const { rows } = await query(
    `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return mapNotificationRow(rows[0]);
};

const markAllAsRead = async (userId) => {
  const { rowCount } = await query(
    `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return { modifiedCount: rowCount };
};

const remove = async (id, userId) => {
  const { rowCount } = await query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rowCount > 0;
};

const deleteByIdAndUserId = async (id, userId) => {
  return await remove(id, userId);
};

const deleteAllForUser = async (userId) => {
  const { rowCount } = await query(
    `DELETE FROM notifications WHERE user_id = $1`,
    [userId]
  );
  return { deletedCount: rowCount };
};

const deleteOldNotifications = async (beforeDate) => {
  const { rowCount } = await query(
    `DELETE FROM notifications WHERE created_at < $1`,
    [beforeDate]
  );
  return { deletedCount: rowCount };
};

const update = async (id, updateData) => {
  const fields = [];
  const params = [id];
  let paramIndex = 2;

  const allowed = {
    title: 'title',
    body: 'body',
    type: 'type',
    data: 'data',
    read: 'is_read',
    is_read: 'is_read'
  };

  for (const [key, dbCol] of Object.entries(allowed)) {
    if (updateData[key] !== undefined) {
      fields.push(`${dbCol} = $${paramIndex}`);
      params.push(dbCol === 'data' ? JSON.stringify(updateData[key]) : updateData[key]);
      paramIndex++;
    }
  }

  if (fields.length === 0) return await findById(id);

  const { rows } = await query(
    `UPDATE notifications SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return mapNotificationRow(rows[0]);
};

const updateMany = async (filters, updateData) => {
  // Simple updateMany by first finding keys
  const items = await findWithFilters(filters, { limit: 1000 });
  let modifiedCount = 0;
  for (const item of items) {
    const updated = await update(item.id, updateData);
    if (updated) modifiedCount++;
  }
  return { modifiedCount };
};

module.exports = {
  create,
  createBulk,
  findById,
  findByUserId,
  findWithFilters,
  count,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  delete: remove,
  deleteByIdAndUserId,
  deleteAllForUser,
  deleteOldNotifications,
  update,
  updateMany,
};