const { query } = require("../../config/postgres");
const { AppError } = require("../../middleware/errorHandler");

/**
 * Patient Repository - PostgreSQL data access layer
 */
class PatientRepository {
  /**
   * Create patient profile
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>} Created patient
   */
  async create(patientData) {
    const {
      userId,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      allergies,
      chronicConditions,
    } = patientData;

    const sql = `
            INSERT INTO patients (user_id, date_of_birth, gender, blood_group, address, 
                                 emergency_contact_name, emergency_contact_phone, emergency_contact_relation, allergies, chronic_conditions)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, user_id, date_of_birth, gender, blood_group, address,
                      emergency_contact_name, emergency_contact_phone, emergency_contact_relation, allergies, chronic_conditions,
                      created_at, updated_at
        `;

    const result = await query(sql, [
      userId,
      dateOfBirth || null,
      gender || null,
      bloodGroup || null,
      address || null,
      emergencyContactName || null,
      emergencyContactPhone || null,
      emergencyContactRelation || null,
      allergies || [],
      chronicConditions || [],
    ]);

    return result.rows[0];
  }

  /**
   * Find patient by user ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} Patient object or null
   */
  async findByUserId(userId) {
    const sql = `
            SELECT p.*, 
                   u.id as internal_id,
                   u.user_id as formatted_user_id,
                   u.name, 
                   u.email, 
                   u.phone, 
                   u.is_active,
                   u.hospital_id, 
                   u.hospital_name
            FROM patients p
            INNER JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1
        `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update patient profile
   * @param {string} userId - User UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated patient
   */
  async update(userId, updates) {
    const allowedFields = [
      "date_of_birth",
      "gender",
      "blood_group",
      "address",
      "emergency_contact_name",
      "emergency_contact_phone",
      "emergency_contact_relation",
      "allergies",
      "chronic_conditions",
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

    values.push(userId);

    const sql = `
            UPDATE patients
            SET ${updateFields.join(", ")}
            WHERE user_id = $${paramCount}
            RETURNING id, user_id, date_of_birth, gender, blood_group, address,
                      emergency_contact_name, emergency_contact_phone, emergency_contact_relation, allergies, chronic_conditions,
                      created_at, updated_at
        `;

    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = new PatientRepository();
