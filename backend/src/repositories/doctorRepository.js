const { query, getClient } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * Doctor Repository - PostgreSQL data access layer
 */
class DoctorRepository {
  /**
   * Create doctor profile
   * @param {Object} doctorData - Doctor data
   * @returns {Promise<Object>} Created doctor
   */
  async create(doctorData) {
    const {
      userId,
      specialization,
      qualification,
      experience,
      consultationFee,
      licenseNumber,
      department,
      bio,
      availability,
    } = doctorData;

    const sql = `
            INSERT INTO doctors (user_id, specialization, qualification, experience, consultation_fee, 
                                license_number, department, bio, availability)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, user_id, specialization, qualification, experience, consultation_fee,
                      license_number, department, bio, availability, created_at, updated_at
        `;

    const result = await query(sql, [
      userId,
      specialization,
      qualification,
      experience,
      consultationFee,
      licenseNumber || null,
      department || null,
      bio || null,
      JSON.stringify(availability || {}),
    ]);

    return result.rows[0];
  }

  /**
   * Find doctor by user ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} Doctor object or null
   */
  async findByUserId(userId) {
    const sql = `
            SELECT d.*, u.name, u.email, u.phone, u.hospital_id, u.hospital_name
            FROM doctors d
            INNER JOIN users u ON d.user_id = u.id
            WHERE d.user_id = $1
        `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update doctor profile
   * @param {string} userId - User UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated doctor
   */
  async update(userId, updates) {
    const allowedFields = [
      "specialization",
      "qualification",
      "experience",
      "consultation_fee",
      "license_number",
      "department",
      "bio",
      "availability",
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      const dbField = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      if (allowedFields.includes(dbField)) {
        if (dbField === "availability") {
          updateFields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          updateFields.push(`${dbField} = $${paramCount}`);
          values.push(updates[key]);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new AppError("No valid fields to update", 400);
    }

    values.push(userId);

    const sql = `
            UPDATE doctors
            SET ${updateFields.join(", ")}
            WHERE user_id = $${paramCount}
            RETURNING id, user_id, specialization, qualification, experience, consultation_fee,
                      license_number, department, bio, availability, created_at, updated_at
        `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Find doctors by specialization
   * @param {string} specialization - Specialization
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise<Array>} Array of doctors
   */
  async findBySpecialization(specialization, hospitalId = null) {
    let sql = `
            SELECT d.*, u.name, u.email, u.phone, u.hospital_id, u.hospital_name
            FROM doctors d
            INNER JOIN users u ON d.user_id = u.id
            WHERE d.specialization ILIKE $1 AND u.is_active = true
        `;

    const params = [`%${specialization}%`];

    if (hospitalId) {
      sql += ` AND u.hospital_id = $2`;
      params.push(hospitalId);
    }

    sql += ` ORDER BY u.name`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get all doctors with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Doctors with pagination
   */
  async findAll(filters = {}) {
    const { hospitalId, specialization, limit = 20, offset = 0 } = filters;

    let sql = `
            SELECT d.*, u.id as user_id, u.user_id as custom_user_id, u.name, u.email, 
                   u.phone, u.hospital_id, u.hospital_name
            FROM doctors d
            INNER JOIN users u ON d.user_id = u.id
            WHERE u.is_active = true
        `;

    const params = [];
    let paramCount = 1;

    if (hospitalId) {
      sql += ` AND u.hospital_id = $${paramCount}`;
      params.push(hospitalId);
      paramCount++;
    }

    if (specialization) {
      sql += ` AND d.specialization ILIKE $${paramCount}`;
      params.push(`%${specialization}%`);
      paramCount++;
    }

    sql += ` ORDER BY u.name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Search doctors by name or specialization
   * @param {string} searchTerm - Search term
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise<Array>} Array of doctors
   */
  async search(searchTerm, hospitalId = null) {
    let sql = `
            SELECT d.*, u.id as user_id, u.user_id as custom_user_id, u.name, u.email, 
                   u.phone, u.hospital_id, u.hospital_name
            FROM doctors d
            INNER JOIN users u ON d.user_id = u.id
            WHERE u.is_active = true 
            AND (u.name ILIKE $1 OR d.specialization ILIKE $1)
        `;

    const params = [`%${searchTerm}%`];

    if (hospitalId) {
      sql += ` AND u.hospital_id = $2`;
      params.push(hospitalId);
    }

    sql += ` ORDER BY u.name LIMIT 20`;

    const result = await query(sql, params);
    return result.rows;
  }
}

module.exports = new DoctorRepository();
