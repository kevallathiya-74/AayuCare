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
            SELECT d.id, d.user_id, d.specialization, d.qualification, d.experience, 
                   d.consultation_fee, d.license_number, d.department, d.bio, d.availability,
                   u.id as user_uuid, u.user_id as custom_user_id, u.name, u.email, 
                   u.phone, u.hospital_id, u.hospital_name, u.is_active,
                   d.created_at, d.updated_at
            FROM doctors d
            INNER JOIN users u ON d.user_id = u.id
            WHERE d.user_id = $1
        `;

    const result = await query(sql, [userId]);
    const row = result.rows[0];
    
    if (!row) return null;
    
    // Map snake_case PostgreSQL fields to camelCase for frontend
    return {
      _id: row.user_uuid,
      id: row.user_uuid,
      userId: row.custom_user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      isActive: row.is_active,
      specialization: row.specialization,
      qualification: row.qualification,
      experience: row.experience,
      consultationFee: parseFloat(row.consultation_fee),
      licenseNumber: row.license_number,
      department: row.department,
      bio: row.bio,
      availability: row.availability,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
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
            SELECT d.id, d.user_id, d.specialization, d.qualification, d.experience, 
                   d.consultation_fee, d.license_number, d.department, d.bio, d.availability,
                   u.id as user_uuid, u.user_id as custom_user_id, u.name, u.email, 
                   u.phone, u.hospital_id, u.hospital_name, u.is_active,
                   d.created_at, d.updated_at
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
    
    // Map snake_case PostgreSQL fields to camelCase for frontend
    const mappedDoctors = result.rows.map(row => ({
      _id: row.user_uuid,
      id: row.user_uuid,
      userId: row.custom_user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      isActive: row.is_active,
      specialization: row.specialization,
      qualification: row.qualification,
      experience: row.experience,
      consultationFee: parseFloat(row.consultation_fee),
      licenseNumber: row.license_number,
      department: row.department,
      bio: row.bio,
      availability: row.availability,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    return mappedDoctors;
  }

  /**
   * Get all doctors with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Doctors with pagination
   */
  async findAll(filters = {}) {
    const { hospitalId, specialization, limit = 20, offset = 0 } = filters;

    let sql = `
            SELECT d.id, d.user_id, d.specialization, d.qualification, d.experience, 
                   d.consultation_fee, d.license_number, d.department, d.bio, d.availability,
                   u.id as user_uuid, u.user_id as custom_user_id, u.name, u.email, 
                   u.phone, u.hospital_id, u.hospital_name, u.is_active,
                   d.created_at, d.updated_at
            FROM doctors d
            INNER JOIN users u ON d.user_id = u.id
            WHERE 1=1
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
    
    // Map snake_case PostgreSQL fields to camelCase for frontend
    const mappedDoctors = result.rows.map(row => ({
      _id: row.user_uuid, // MongoDB compatibility
      id: row.user_uuid,
      userId: row.custom_user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      isActive: row.is_active,
      specialization: row.specialization,
      qualification: row.qualification,
      experience: row.experience,
      consultationFee: parseFloat(row.consultation_fee),
      licenseNumber: row.license_number,
      department: row.department,
      bio: row.bio,
      availability: row.availability,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    return mappedDoctors;
  }

  /**
   * Search doctors by name or specialization
   * @param {string} searchTerm - Search term
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise<Array>} Array of doctors
   */
  async search(searchTerm, hospitalId = null, options = {}) {
    const {
      includeInactive = false,
      specialization,
      limit = 20,
      offset = 0,
    } = options;

    let sql = `
            SELECT d.id, d.user_id, d.specialization, d.qualification, d.experience, 
                   d.consultation_fee, d.license_number, d.department, d.bio, d.availability,
                   u.id as user_uuid, u.user_id as custom_user_id, u.name, u.email, 
                   u.phone, u.hospital_id, u.hospital_name, u.is_active,
                   d.created_at, d.updated_at
            FROM doctors d
            INNER JOIN users u ON d.user_id = u.id
            WHERE 1=1
        `;

    const params = [];
    let paramCount = 1;

    if (!includeInactive) {
      sql += ` AND u.is_active = true`;
    }

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

    sql += `
            AND (
              u.name ILIKE $${paramCount}
              OR u.email ILIKE $${paramCount}
              OR u.phone ILIKE $${paramCount}
              OR d.specialization ILIKE $${paramCount}
              OR d.qualification ILIKE $${paramCount}
            )
        `;
    params.push(`%${searchTerm}%`);
    paramCount++;

    sql += ` ORDER BY u.name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    
    // Map snake_case PostgreSQL fields to camelCase for frontend
    const mappedDoctors = result.rows.map(row => ({
      _id: row.user_uuid, // MongoDB compatibility
      id: row.user_uuid,
      userId: row.custom_user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      isActive: row.is_active,
      specialization: row.specialization,
      qualification: row.qualification,
      experience: row.experience,
      consultationFee: parseFloat(row.consultation_fee),
      licenseNumber: row.license_number,
      department: row.department,
      bio: row.bio,
      availability: row.availability,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    return mappedDoctors;
  }

  /**
   * Count all doctors matching filters (used for accurate pagination)
   */
  async countAll(filters = {}) {
    const { hospitalId, specialization, includeInactive = false } = filters;
    let sql = `SELECT COUNT(*) AS count FROM doctors d INNER JOIN users u ON d.user_id = u.id WHERE 1=1`;
    const params = [];
    let p = 1;
    if (!includeInactive) sql += ` AND u.is_active = true`;
    if (hospitalId) { sql += ` AND u.hospital_id = $${p++}`; params.push(hospitalId); }
    if (specialization) { sql += ` AND d.specialization ILIKE $${p++}`; params.push(`%${specialization}%`); }
    const result = await query(sql, params);
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Count doctors matching search + filters (used for accurate pagination)
   */
  async countSearch(searchTerm, hospitalId = null, options = {}) {
    const { includeInactive = false, specialization } = options;
    let sql = `SELECT COUNT(*) AS count FROM doctors d INNER JOIN users u ON d.user_id = u.id WHERE 1=1`;
    const params = [];
    let p = 1;
    if (!includeInactive) sql += ` AND u.is_active = true`;
    if (hospitalId) { sql += ` AND u.hospital_id = $${p++}`; params.push(hospitalId); }
    if (specialization) { sql += ` AND d.specialization ILIKE $${p++}`; params.push(`%${specialization}%`); }
    sql += ` AND (u.name ILIKE $${p} OR u.email ILIKE $${p} OR d.specialization ILIKE $${p} OR d.qualification ILIKE $${p})`;
    params.push(`%${searchTerm}%`);
    const result = await query(sql, params);
    return Number(result.rows[0]?.count || 0);
  }
}

module.exports = new DoctorRepository();
