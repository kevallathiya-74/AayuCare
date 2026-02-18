const { query, getClient } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * User Repository - PostgreSQL data access layer
 * No business logic - pure database operations only
 */
class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    const {
      userId,
      name,
      email,
      phone,
      passwordHash,
      role,
      hospitalId,
      hospitalName,
    } = userData;

    const sql = `
            INSERT INTO users (user_id, name, email, phone, password_hash, role, hospital_id, hospital_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, user_id, name, email, phone, role, hospital_id, hospital_name, 
                      is_active, email_verified, phone_verified, created_at, updated_at
        `;

    const result = await query(sql, [
      userId,
      name,
      email,
      phone,
      passwordHash,
      role,
      hospitalId,
      hospitalName,
    ]);

    return result.rows[0];
  }

  /**
   * Find user by ID
   * @param {string} id - User UUID
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(id) {
    const sql = `
            SELECT id, user_id, name, email, phone, role, hospital_id, hospital_name, 
                   is_active, email_verified, phone_verified, created_at, updated_at, last_login
            FROM users
            WHERE id = $1
        `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @param {boolean} includePassword - Include password hash
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmail(email, includePassword = false) {
    const fields = includePassword
      ? "id, user_id, name, email, phone, password_hash, role, hospital_id, hospital_name, is_active"
      : "id, user_id, name, email, phone, role, hospital_id, hospital_name, is_active, email_verified, phone_verified";

    const sql = `SELECT ${fields} FROM users WHERE email = $1`;
    const result = await query(sql, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by phone
   * @param {string} phone - User phone number
   * @returns {Promise<Object|null>} User object or null
   */
  async findByPhone(phone) {
    const sql = `
            SELECT id, user_id, name, email, phone, role, hospital_id, hospital_name, 
                   is_active, email_verified, phone_verified
            FROM users
            WHERE phone = $1
        `;

    const result = await query(sql, [phone]);
    return result.rows[0] || null;
  }

  /**
   * Find user by userId (custom ID)
   * @param {string} userId - Custom user ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findByUserId(userId) {
    const sql = `
            SELECT id, user_id, name, email, phone, role, hospital_id, hospital_name, 
                   is_active, email_verified, phone_verified, created_at, updated_at
            FROM users
            WHERE user_id = $1
        `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update user
   * @param {string} id - User UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async update(id, updates) {
    const allowedFields = [
      "name",
      "email",
      "phone",
      "password_hash",
      "hospital_name",
      "is_active",
      "email_verified",
      "phone_verified",
      "last_login",
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
            UPDATE users
            SET ${updateFields.join(", ")}
            WHERE id = $${paramCount}
            RETURNING id, user_id, name, email, phone, role, hospital_id, hospital_name, 
                      is_active, email_verified, phone_verified, created_at, updated_at
        `;

    logger.info("[USER_UPDATE] Executing SQL update", {
      id,
      updates,
      sql: sql.substring(0, 100),
      values: values.map((v, i) => i === values.indexOf(updates.password_hash) ? '***' : v)
    });

    const result = await query(sql, values);
    
    if (!result.rows || result.rows.length === 0) {
      logger.error("[USER_UPDATE] No rows returned after update", { id });
      throw new AppError("User not found or update failed", 404);
    }
    
    const row = result.rows[0];
    
    logger.info("[USER_UPDATE] SQL update successful", {
      userId: row.user_id,
      updatedIsActive: row.is_active
    });
    
    // Map snake_case PostgreSQL fields to camelCase for frontend
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      phoneVerified: row.phone_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Delete user (soft delete by setting is_active = false)
   * @param {string} id - User UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const sql = `UPDATE users SET is_active = false WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get next auto-increment ID number for a role
   * @param {string} role - User role (patient, doctor, admin)
   * @param {string} hospitalId - Hospital ID (optional)
   * @returns {Promise<string>} Next ID in format PAT1, DOC1, ADM1, etc.
   */
  async getNextUserId(role, hospitalId = null) {
    const prefix = role === 'patient' ? 'PAT' : role === 'doctor' ? 'DOC' : 'ADM';
    
    // Use numeric sorting by extracting the number from user_id
    let sql = `
      SELECT user_id FROM users 
      WHERE role = $1 AND user_id LIKE $2
    `;
    
    const params = [role, `${prefix}%`];
    
    if (hospitalId) {
      sql += ` AND hospital_id = $3`;
      params.push(hospitalId);
    }
    
    // CRITICAL FIX: Sort by numeric value, not string (PAT10 > PAT9, not PAT9 > PAT10)
    sql += ` ORDER BY CAST(SUBSTRING(user_id FROM '[0-9]+') AS INTEGER) DESC LIMIT 1`;
    
    const result = await query(sql, params);
    
    if (result.rows.length === 0) {
      return `${prefix}1`;
    }
    
    // Extract number from last ID (e.g., PAT123 -> 123)
    const lastId = result.rows[0].user_id;
    const lastNumber = parseInt(lastId.replace(prefix, '')) || 0;
    const nextNumber = lastNumber + 1;
    
    return `${prefix}${nextNumber}`;
  }

  /**
   * Find all users by role
   * @param {string} role - User role
   * @param {string} hospitalId - Hospital ID (optional)
   * @returns {Promise<Array>} Array of users
   */
  async findByRole(role, hospitalId = null) {
    let sql = `
            SELECT id, user_id, name, email, phone, role, hospital_id, hospital_name, 
                   is_active, created_at, updated_at
            FROM users
            WHERE role = $1 AND is_active = true
        `;

    const params = [role];

    if (hospitalId) {
      sql += ` AND hospital_id = $2`;
      params.push(hospitalId);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Find all doctors in a hospital
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise<Array>} Array of doctor users
   */
  async findDoctorsByHospital(hospitalId) {
    const sql = `
            SELECT u.id, u.user_id, u.name, u.email, u.phone, u.hospital_id, u.hospital_name,
                   d.specialization, d.qualification, d.experience, d.consultation_fee,
                   d.license_number, d.department, d.bio
            FROM users u
            INNER JOIN doctors d ON u.id = d.user_id
            WHERE u.hospital_id = $1 AND u.role = 'doctor' AND u.is_active = true
            ORDER BY u.name
        `;

    const result = await query(sql, [hospitalId]);
    return result.rows;
  }

  /**
   * Find all patients in a hospital with optional search
   * @param {string} hospitalId - Hospital ID
   * @param {number} limit - Limit
   * @param {number} offset - Offset
   * @param {string} searchTerm - Optional search term for name, email, phone, or userId
   * @returns {Promise<Object>} Patients with pagination
   */
  /**
   * Find patients by hospital with pagination and search
   * @param {string} hospitalId - Hospital ID to filter by
   * @param {number} limit - Maximum number of records to return (default: 20)
   * @param {number} offset - Number of records to skip for pagination (default: 0)
   * @param {string} searchTerm - Optional search term to filter by name, email, phone, or user_id
   * @returns {Promise<Object>} Object containing:
   *   - data: Array of patient records with user and patient profile information
   *   - total: Total count of matching patients
   * @description
   * Performs INNER JOIN between users and patients tables.
   * Filters by:
   * - hospital_id (multi-tenancy)
   * - role = 'patient'
   * - Includes both active and inactive users (frontend handles display)
   * - Optional search across name, email, phone, user_id (case-insensitive)
   * Uses parameterized queries to prevent SQL injection.
   */
  async findPatientsByHospital(hospitalId, limit = 20, offset = 0, searchTerm = '') {
    // Build WHERE clause with search conditions (includes inactive users)
    let whereConditions = 'u.hospital_id = $1 AND u.role = \'patient\'';
    const params = [hospitalId];
    let paramIndex = 2;

    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      whereConditions += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex} OR u.user_id ILIKE $${paramIndex})`;
      params.push(searchPattern);
      paramIndex++;
    }

    const sql = `
            SELECT u.id, u.user_id, u.name, u.email, u.phone, u.hospital_id, u.is_active,
                   p.date_of_birth, p.gender, p.blood_group, p.address,
                   p.emergency_contact_name, p.emergency_contact_phone, 
                   p.allergies, p.chronic_conditions
            FROM users u
            INNER JOIN patients p ON u.id = p.user_id
            WHERE ${whereConditions}
            ORDER BY u.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

    const countSql = `
            SELECT COUNT(*) 
            FROM users u
            INNER JOIN patients p ON u.id = p.user_id
            WHERE ${whereConditions}
        `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, [...params, limit, offset]),
      query(countSql, params),
    ]);

    // Map snake_case PostgreSQL fields to camelCase for frontend
    const mappedData = dataResult.rows.map(row => ({
      _id: row.id, // MongoDB compatibility
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      hospitalId: row.hospital_id,
      isActive: row.is_active,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      bloodGroup: row.blood_group,
      address: row.address,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      allergies: row.allergies,
      chronicConditions: row.chronic_conditions
    }));

    const total = parseInt(countResult.rows[0].count, 10);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: mappedData,
      total,
      page,
      limit
    };
  }

  /**
   * Check if email exists
   * @param {string} email - Email address
   * @returns {Promise<boolean>} True if exists
   */
  async emailExists(email) {
    const sql = `SELECT 1 FROM users WHERE email = $1 LIMIT 1`;
    const result = await query(sql, [email]);
    return result.rowCount > 0;
  }

  /**
   * Check if phone exists
   * @param {string} phone - Phone number
   * @returns {Promise<boolean>} True if exists
   */
  async phoneExists(phone) {
    const sql = `SELECT 1 FROM users WHERE phone = $1 LIMIT 1`;
    const result = await query(sql, [phone]);
    return result.rowCount > 0;
  }
}

module.exports = new UserRepository();
