const { query, withTransaction } = require("../../config/postgres");

/**
 * Admin Repository
 * Handles all raw SQL queries related to admin operations and system stats
 */
class AdminRepository {
  async hasPatientEmergencyContactRelationColumn() {
    const result = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'patients'
          AND column_name = 'emergency_contact_relation'
      ) AS exists
    `);

    return result.rows[0]?.exists === true;
  }

  async pingPostgres() {
    await query('SELECT 1');
    return true;
  }

  // 1. Dashboard Stats
  async getAppointmentStats({ today, tomorrow, yesterday, currentMonthStart, previousMonthStart, hospitalId }) {
    const hasHospitalFilter = !!hospitalId;
    const params = [today, tomorrow, yesterday, currentMonthStart, previousMonthStart];
    if (hasHospitalFilter) params.push(hospitalId);

    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE 1=1) as total,
        COUNT(*) FILTER (WHERE appointment_date >= $1 AND appointment_date < $2) as today,
        COUNT(*) FILTER (WHERE appointment_date >= $3 AND appointment_date < $1) as yesterday,
        COUNT(*) FILTER (WHERE status IN ('scheduled', 'confirmed')) as pending,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE appointment_date >= $4) as this_month,
        COUNT(*) FILTER (WHERE appointment_date >= $5 AND appointment_date < $4) as previous_month
      FROM appointments
      WHERE 1=1 ${hasHospitalFilter ? 'AND hospital_id = $6' : ''}
    `, params);
    return result.rows[0];
  }

  async getDoctorStats({ currentMonthStart, previousMonthStart, hospitalId }) {
    const hasHospitalFilter = !!hospitalId;
    const params = [currentMonthStart, previousMonthStart];
    if (hasHospitalFilter) params.push(hospitalId);

    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE created_at >= $1) as new_this_month,
        COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $1) as new_previous_month
      FROM users
      WHERE role = 'doctor' ${hasHospitalFilter ? 'AND hospital_id = $3' : ''}
    `, params);
    return result.rows[0];
  }

  async getPatientStats({ currentMonthStart, previousMonthStart, hospitalId }) {
    const hasHospitalFilter = !!hospitalId;
    const params = [currentMonthStart, previousMonthStart];
    if (hasHospitalFilter) params.push(hospitalId);

    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= $1) as new_this_month,
        COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $1) as new_previous_month
      FROM users
      WHERE role = 'patient' ${hasHospitalFilter ? 'AND hospital_id = $3' : ''}
    `, params);
    return result.rows[0];
  }

  async getRevenueStats({ today, tomorrow, yesterday, hospitalId }) {
    const hasHospitalFilter = !!hospitalId;
    const params = [today, tomorrow, yesterday];
    if (hasHospitalFilter) params.push(hospitalId);

    const result = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total,
        COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= $1 AND p.created_at < $2 THEN p.amount ELSE 0 END), 0) as today,
        COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= $3 AND p.created_at < $1 THEN p.amount ELSE 0 END), 0) as yesterday
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      WHERE 1=1 ${hasHospitalFilter ? 'AND a.hospital_id = $4' : ''}
    `, params);
    return result.rows[0];
  }

  // 2. Recent Activities
  async getRecentAppointments({ limit, hospitalId }) {
    const hasHospitalFilter = !!hospitalId;
    const params = [limit];
    if (hasHospitalFilter) params.push(hospitalId);

    const result = await query(`
      SELECT a.id, a.created_at,
             p.name as patient_name, p.user_id as patient_user_id,
             d.name as doctor_name, d.user_id as doctor_user_id
      FROM appointments a
      LEFT JOIN users p ON a.patient_id = p.id
      LEFT JOIN users d ON a.doctor_id = d.id
      WHERE 1=1 ${hasHospitalFilter ? 'AND a.hospital_id = $2' : ''}
      ORDER BY a.created_at DESC
      LIMIT $1
    `, params);
    return result.rows;
  }

  // 3. User Listing
  async getUsers({ role, search, hospitalId, includeInactive, limit, skip }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (includeInactive !== 'true') conditions.push(`u.is_active = true`);
    if (hospitalId) {
      conditions.push(`u.hospital_id = $${paramIndex++}`);
      params.push(hospitalId);
    }
    if (role) {
      conditions.push(`u.role = $${paramIndex++}`);
      params.push(role);
    }
    if (search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.user_id ILIKE $${paramIndex++})`);
      params.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const hasEmergencyRelationColumn = await this.hasPatientEmergencyContactRelationColumn();
    const patientEmergencyRelationField = hasEmergencyRelationColumn
      ? 'p.emergency_contact_relation'
      : 'NULL::varchar';

    const doctorFields = `
      d.specialization, d.qualification, d.experience, d.department, d.consultation_fee, d.bio,
      NULL::date AS date_of_birth, NULL::varchar AS gender, NULL::varchar AS blood_group, NULL::text AS address,
      NULL::varchar AS emergency_contact_name, NULL::varchar AS emergency_contact_phone, NULL::varchar AS emergency_contact_relation
    `;
    const patientFields = `
      NULL::varchar AS specialization, NULL::varchar AS qualification, NULL::int AS experience, NULL::varchar AS department,
      NULL::numeric AS consultation_fee, NULL::text AS bio,
      p.date_of_birth, p.gender, p.blood_group, p.address,
      p.emergency_contact_name, p.emergency_contact_phone, ${patientEmergencyRelationField} AS emergency_contact_relation
    `;
    const mixedFields = `
      d.specialization, d.qualification, d.experience, d.department, d.consultation_fee, d.bio,
      p.date_of_birth, p.gender, p.blood_group, p.address,
      p.emergency_contact_name, p.emergency_contact_phone, ${patientEmergencyRelationField} AS emergency_contact_relation
    `;

    let profileFields = mixedFields;
    let joins = `
      LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
      LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
    `;

    if (role === 'doctor') {
      profileFields = doctorFields;
      joins = `LEFT JOIN doctors d ON u.id = d.user_id`;
    } else if (role === 'patient') {
      profileFields = patientFields;
      joins = `LEFT JOIN patients p ON u.id = p.user_id`;
    }

    const usersResult = await query(`
      SELECT u.id, u.user_id, u.name, u.email, u.phone, u.role, u.hospital_id, u.hospital_name,
             u.is_active, u.email_verified, u.phone_verified, u.created_at, u.updated_at,
             ${profileFields}
      FROM users u
      ${joins}
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, [...params, parseInt(limit), parseInt(skip)]);

    const countResult = await query(`SELECT COUNT(*) FROM users u ${whereClause}`, params);
    
    return {
      rows: usersResult.rows,
      total: parseInt(countResult.rows[0].count, 10)
    };
  }

  // 4. Role Management
  async countActiveAdmins() {
    const result = await query(`SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = true`);
    return parseInt(result.rows[0].count, 10);
  }

  async updateUserRole(userId, role) {
    await query(`UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`, [role, userId]);
  }

  async getSecurityStats({ sevenDaysAgo, today, hospitalId }) {
    const hasHospSec = !!hospitalId;
    const params = [sevenDaysAgo, today];
    if (hasHospSec) params.push(hospitalId);

    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true AND last_login >= $1) as active_users_7d,
        COUNT(*) FILTER (WHERE last_login >= $2) as recent_logins,
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users
      FROM users
      ${hasHospSec ? "WHERE hospital_id = $3" : ""}
    `, params);
    
    const sessionRes = await query(`SELECT COUNT(*)::int AS active_sessions FROM session WHERE expires_at > NOW()`);
    
    return {
      stats: result.rows[0],
      totalActiveSessions: parseInt(sessionRes.rows[0]?.active_sessions || 0, 10)
    };
  }

  async getTotalActiveSessions() {
    const result = await query(`SELECT COUNT(*)::int AS active_sessions FROM session WHERE expires_at > NOW()`);
    return parseInt(result.rows[0]?.active_sessions || 0, 10);
  }

  async getUserActiveSessions(userId) {
    const result = await query(`SELECT COUNT(*)::int AS active_sessions FROM session WHERE user_id = $1 AND expires_at > NOW()`, [userId]);
    return parseInt(result.rows[0]?.active_sessions || 0, 10);
  }

  async getPasswordHash(userId) {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.password_hash;
  }

  async updatePasswordHash(userId, newHash) {
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
  }

  async deleteAllUserSessions(userId) {
    const result = await query('DELETE FROM session WHERE user_id = $1', [userId]);
    return result.rowCount;
  }

  async touchUser(userId) {
    await query('UPDATE users SET updated_at = NOW() WHERE id = $1', [userId]);
  }

  // 8. System Metrics
  async getUserGrowth(hospitalId) {
    const hasHospitalFilter = !!hospitalId;
    const params = hasHospitalFilter ? [hospitalId] : [];
    const result = await query(`
      SELECT EXTRACT(YEAR FROM created_at) as year, EXTRACT(MONTH FROM created_at) as month, role, COUNT(*) as count
      FROM users
      WHERE 1=1 ${hasHospitalFilter ? 'AND hospital_id = $1' : ''}
      GROUP BY year, month, role
      ORDER BY year DESC, month DESC
      LIMIT 12
    `, params);
    return result.rows;
  }

  async getAppointmentTrends(hospitalId) {
    const hasHospitalFilter = !!hospitalId;
    const params = hasHospitalFilter ? [hospitalId] : [];
    const result = await query(`
      SELECT EXTRACT(YEAR FROM created_at) as year, EXTRACT(MONTH FROM created_at) as month, status, COUNT(*) as count
      FROM appointments
      WHERE 1=1 ${hasHospitalFilter ? 'AND hospital_id = $1' : ''}
      GROUP BY year, month, status
      ORDER BY year DESC, month DESC
      LIMIT 12
    `, params);
    return result.rows;
  }

  async getActiveUsersCount(weekAgo, hospitalId) {
    const hasHospitalFilter = !!hospitalId;
    const params = hasHospitalFilter ? [weekAgo, hospitalId] : [weekAgo];
    const result = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_login >= $1 ${hasHospitalFilter ? 'AND hospital_id = $2' : ''}
    `, params);
    return parseInt(result.rows[0].count, 10);
  }

  async getTotalUsersCount(hospitalId) {
    const hasHospitalFilter = !!hospitalId;
    const params = hasHospitalFilter ? [hospitalId] : [];
    const result = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE 1=1 ${hasHospitalFilter ? 'AND hospital_id = $1' : ''}
    `, params);
    return parseInt(result.rows[0].count, 10);
  }

  // 9. Create User
  async createDoctorProfile(doctorId, spec, qual, exp, dept, fee, lic, bio, avail) {
    await query(`
      INSERT INTO doctors (user_id, specialization, qualification, experience, department, consultation_fee, license_number, bio, availability)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [doctorId, spec, qual, exp, dept, fee, lic, bio, avail]);
  }

  async createPatientProfile(queryStr, values) {
    await query(queryStr, values);
  }

  // 10. Update Profile
  async checkDuplicateEmail(email, userId) {
    const result = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    return result.rows.length > 0;
  }

  async checkDuplicatePhone(phone, userId) {
    const result = await query('SELECT id FROM users WHERE phone = $1 AND id != $2', [phone, userId]);
    return result.rows.length > 0;
  }

  async checkDoctorExists(userId) {
    const result = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    return result.rows.length > 0;
  }

  async checkPatientExists(userId) {
    const result = await query('SELECT id FROM patients WHERE user_id = $1', [userId]);
    return result.rows.length > 0;
  }

  async updateDoctorProfile(queryStr, values) {
    const result = await query(queryStr, values);
    return result.rowCount;
  }

  async updatePatientProfile(queryStr, values) {
    const result = await query(queryStr, values);
    return result.rowCount;
  }

  // 11. Deletion Support
  async countActiveAppointments(doctorId, date) {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE doctor_id = $1
      AND status IN ('scheduled', 'confirmed')
      AND appointment_date >= $2
    `, [doctorId, date]);
    return parseInt(result.rows[0].count, 10);
  }
  
  async deleteDoctorProfile(client, userId) {
    await client.query('DELETE FROM doctors WHERE user_id = $1', [userId]);
  }

  async deletePatientProfile(client, userId) {
    await client.query('DELETE FROM patients WHERE user_id = $1', [userId]);
  }

  async deleteUser(client, userId) {
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
  }

  // 12. Audit Logs
  async getAuditLogs({ hospitalId, userId, action, entityType, limit, offset }) {
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (hospitalId) {
      // NOTE: Assuming audit logs don't have hospitalId directly, joining from users table
      conditions.push(`u.hospital_id = $${paramIdx++}`);
      params.push(hospitalId);
    }
    if (userId) {
      conditions.push(`al.user_id = $${paramIdx++}::uuid`);
      params.push(userId);
    }
    if (action) {
      conditions.push(`al.action = $${paramIdx++}`);
      params.push(action);
    }
    if (entityType) {
      conditions.push(`al.entity_type = $${paramIdx++}`);
      params.push(entityType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) as total FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const logsResult = await query(
      `SELECT al.id, al.action, al.entity_type, al.entity_id, al.old_values, al.new_values, al.ip_address, al.user_agent, al.successful, al.error_message, al.created_at, u.name AS actor_name, u.user_id AS actor_user_id, u.role AS actor_role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, limit, offset]
    );

    return { rows: logsResult.rows, total };
  }

  async bulkUpdateUsers(operations, scopedHospitalId, isSuperAdmin) {
    const client = await this.getRawClient();
    await client.query('BEGIN');
    const results = [];
    try {
      for (const op of operations) {
        const { userId, action, data } = op;
        const userResult = await client.query('SELECT id, hospital_id FROM users WHERE user_id = $1', [userId]);
        if (userResult.rows.length === 0) {
          results.push({ userId, action, success: false, error: 'User not found' });
          continue;
        }
        const userRow = userResult.rows[0];
        if (scopedHospitalId && !isSuperAdmin && userRow.hospital_id !== scopedHospitalId) {
          results.push({ userId, action, success: false, error: "Access denied" });
          continue;
        }
        let result;
        const userUuid = userRow.id;
        switch (action) {
          case "activate": result = await client.query('UPDATE users SET is_active = true WHERE id = $1 RETURNING id', [userUuid]); break;
          case "deactivate": result = await client.query('UPDATE users SET is_active = false WHERE id = $1 RETURNING id', [userUuid]); break;
          case "updateRole": result = await client.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id', [data.role, userUuid]); break;
          default: throw new Error(`Unknown action ${action}`);
        }
        results.push({ userId, action, success: result.rowCount > 0 });
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return results;
  }

  async getDatabaseSize() {
    const result = await query("SELECT pg_size_pretty(pg_database_size(current_database())) as size");
    return result.rows[0]?.size || "unknown";
  }

  async getMedicalRecordTypeStats(scopedHospitalId, patientId) {
    let typeStatsQuery = `
      SELECT record_type as type, COUNT(*) as count 
      FROM medical_records 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (scopedHospitalId) {
      typeStatsQuery += ` AND hospital_id = $${paramIndex}`;
      params.push(scopedHospitalId);
      paramIndex++;
    }
    if (patientId) {
      typeStatsQuery += ` AND patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
    }
    typeStatsQuery += ` GROUP BY record_type`;

    const result = await query(typeStatsQuery, params);
    return result.rows.map(r => ({ type: r.type, count: parseInt(r.count, 10) }));
  }

  async getNotificationTypeStats(scopedHospitalId, type) {
    let typeDistQuery = `
      SELECT type, COUNT(*) as count 
      FROM notifications 
      WHERE hospital_id = $1
    `;
    const params = [scopedHospitalId || "MAIN"];
    if (type) {
      typeDistQuery += ` AND type = $2`;
      params.push(type);
    }
    typeDistQuery += ` GROUP BY type`;

    const result = await query(typeDistQuery, params);
    return result.rows.map(r => ({ type: r.type, count: parseInt(r.count, 10) }));
  }

  async purgeUserData(user) {
    await withTransaction(async (client) => {
      // 1. Delete payments
      await client.query("DELETE FROM payments WHERE patient_id = $1 OR doctor_id = $1", [user.id]);
      
      // 2. Delete appointments
      await client.query("DELETE FROM appointments WHERE patient_id = $1 OR doctor_id = $1", [user.id]);
      
      // 3. Delete prescriptions
      await client.query("DELETE FROM prescriptions WHERE patient_id = $1 OR doctor_id = $1", [user.id]);
      
      // 4. Delete attachments
      await client.query(`
        DELETE FROM attachments 
        WHERE medical_record_id IN (
          SELECT id FROM medical_records WHERE patient_id = $1 OR doctor_id = $1
        )
      `, [user.id]);
      
      // 5. Delete medical records
      await client.query("DELETE FROM medical_records WHERE patient_id = $1 OR doctor_id = $1", [user.id]);
      
      // 6. Delete notification preferences
      await client.query("DELETE FROM notification_preferences WHERE user_id = $1", [user.id]);
      
      // 7. Delete patient or doctor specific profiles
      if (user.role === "doctor") {
        await client.query("DELETE FROM doctors WHERE user_id = $1", [user.id]);
        await client.query("DELETE FROM schedules WHERE doctor_id = $1", [user.id]);
      } else if (user.role === "patient") {
        await client.query("DELETE FROM patients WHERE user_id = $1", [user.id]);
        await client.query("DELETE FROM health_metrics WHERE patient_id = $1", [user.id]);
      }
      
      // 8. Delete user audit logs and session logs
      await client.query("DELETE FROM audit_logs WHERE user_id = $1", [user.id]);
      
      // 9. Finally, delete the user row itself
      await client.query("DELETE FROM users WHERE id = $1", [user.id]);
    });
  }

  // Returns the raw pool client for bulk transactions
  async getRawClient() {
    return require("../../config/postgres").getClient();
  }
}

module.exports = new AdminRepository();
