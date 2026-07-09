const { query } = require("../../config/postgres");
const { AppError } = require("../../middleware/errorHandler");
const logger = require("../../utils/logger");

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
                      is_active, email_verified, phone_verified, preferred_language, created_at, updated_at
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
                   is_active, email_verified, phone_verified, preferred_language, created_at, updated_at, last_login
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
      ? "id, user_id, name, email, phone, password_hash, role, hospital_id, hospital_name, is_active, preferred_language"
      : "id, user_id, name, email, phone, role, hospital_id, hospital_name, is_active, email_verified, phone_verified, preferred_language";

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
                   is_active, email_verified, phone_verified, preferred_language
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
                   is_active, email_verified, phone_verified, preferred_language, created_at, updated_at
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
      "preferred_language",
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
                      is_active, email_verified, phone_verified, preferred_language, created_at, updated_at
        `;

    logger.info("[USER_UPDATE] Executing SQL update", {
      id,
      updates,
      values: values.map((v, i) => i === values.indexOf(updates.password_hash) ? '***' : v)
    });

    const result = await query(sql, values);
    
    if (!result.rows || result.rows.length === 0) {
      logger.error("[USER_UPDATE] No rows returned after update", { id });
      throw new AppError("User not found or update failed", 404);
    }
    
    logger.info("[USER_UPDATE] SQL update successful", {
      id,
      updates
    });
    
    const row = result.rows[0];
    
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
   *
   * Concurrency-safe: uses a PostgreSQL SEQUENCE (one per role prefix)
   * to atomically reserve the next user_id. Replaces the previous
   * SELECT-then-increment algorithm that could produce duplicate IDs
   * under concurrent registrations.
   *
   * @param {string} role - User role (patient, doctor, admin, super_admin)
   * @returns {Promise<string>} Next ID in format PAT1, DOC1, ADM1, SADM1, etc.
   */
  async getNextUserId(role) {
    // Map role → { sequence name, prefix }. Default to admin for safety.
    const roleMap = {
      patient:     { seq: "user_id_pat_seq",  prefix: "PAT"  },
      doctor:      { seq: "user_id_doc_seq",  prefix: "DOC"  },
      super_admin: { seq: "user_id_sadm_seq", prefix: "SADM" },
    };
    const { seq, prefix } = roleMap[role] || { seq: "user_id_adm_seq", prefix: "ADM" };

    // nextval() is atomic; concurrent callers receive distinct values.
    const result = await query(`SELECT nextval($1) AS n`, [seq]);
    return `${prefix}${result.rows[0].n}`;
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
   * Find patients who have had at least one appointment with a specific doctor.
   * Used by the doctor's "My Patients" / Patient Management screen — ensures a
   * doctor only sees patients linked to them via the appointments table, not all
   * hospital patients.
   *
   * @param {string} doctorId   - UUID of the doctor (users.id)
   * @param {string} hospitalId - Hospital scope for multi-tenancy
   * @param {number} limit      - Page size (max 100)
   * @param {number} offset     - Pagination offset
   * @param {string} searchTerm - Optional text filter (name, email, phone, user_id)
   * @returns {Promise<{data: Array, total: number, page: number, limit: number}>}
   */
  async findPatientsByDoctor(doctorId, hospitalId, limit = 20, offset = 0, searchTerm = '') {
    // Filter by hospital + role + doctor-specific appointment link.
    let whereConditions = `u.hospital_id = $1 AND u.role = 'patient' AND a.doctor_id = $2`;
    const params = [hospitalId, doctorId];
    let paramIndex = 3;

    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      whereConditions += ` AND (
        u.name ILIKE $${paramIndex}
        OR u.email ILIKE $${paramIndex}
        OR u.phone ILIKE $${paramIndex}
        OR u.user_id ILIKE $${paramIndex}
      )`;
      params.push(searchPattern);
      paramIndex++;
    }

    // DISTINCT deduplicates patients who have multiple appointments with this doctor.
    const sql = `
      SELECT DISTINCT
             u.id, u.user_id, u.name, u.email, u.phone, u.hospital_id, u.is_active,
             p.date_of_birth, p.gender, p.blood_group, p.address,
             p.emergency_contact_name, p.emergency_contact_phone,
             p.allergies, p.chronic_conditions
      FROM users u
      INNER JOIN patients p  ON u.id = p.user_id
      INNER JOIN appointments a ON a.patient_id = u.id
      WHERE ${whereConditions}
      ORDER BY u.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countSql = `
      SELECT COUNT(DISTINCT u.id)
      FROM users u
      INNER JOIN patients p  ON u.id = p.user_id
      INNER JOIN appointments a ON a.patient_id = u.id
      WHERE ${whereConditions}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, [...params, limit, offset]),
      query(countSql, params),
    ]);

    const mappedData = dataResult.rows.map(row => ({
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
      chronicConditions: row.chronic_conditions,
    }));

    const total = parseInt(countResult.rows[0].count, 10);
    const page = Math.floor(offset / limit) + 1;

    return { data: mappedData, total, page, limit };
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

  /**
   * Find multiple users by their UUIDs in a single batch query.
   * Used to avoid N+1 queries when enriching lists (e.g. prescriptions).
   * @param {string[]} ids - Array of user UUID strings
   * @returns {Promise<Object[]>} Array of user objects (may be shorter than ids if some not found)
   */
  async findByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const sql = `
      SELECT id, user_id, name, email, phone, role, hospital_id, hospital_name,
             is_active, email_verified, phone_verified
      FROM users
      WHERE id = ANY($1::uuid[])
    `;
    const result = await query(sql, [ids]);
    return result.rows;
  }
}

module.exports = new UserRepository();
