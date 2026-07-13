const { query } = require("../../config/postgres");
const { AppError } = require("../../middleware/errorHandler");
const logger = require("../../utils/logger");

/**
 * Auth Repository - Handles authentication-related data access operations
 * Focuses on session and auth-specific data not covered by user/doctor/patient repositories
 */
class AuthRepository {
  /**
   * Find session by token hash
   * @param {string} tokenHash - Hashed session token
   * @returns {Promise<Object|null>} Session object or null
   */
  async findSessionByToken(tokenHash) {
    try {
      const sql = `
              SELECT id, user_id as "userId", token_hash as "token",
                     ip_address as "ipAddress", user_agent as "userAgent",
                     expires_at as "expiresAt", created_at as "createdAt",
                     last_used_at as "updatedAt"
              FROM session
              WHERE token_hash = $1
                  AND expires_at > NOW()
          `;

      const result = await query(sql, [tokenHash]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error in findSessionByToken:", error);
      throw error;
    }
  }

  /**
   * Find valid sessions for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Array>} Array of session objects
   */
  async findSessionsByUserId(userId) {
    try {
      const sql = `
              SELECT id, user_id as "userId", token_hash as "token",
                     ip_address as "ipAddress", user_agent as "userAgent",
                     expires_at as "expiresAt", created_at as "createdAt",
                     last_used_at as "updatedAt"
              FROM session
              WHERE user_id = $1
                  AND expires_at > NOW()
              ORDER BY created_at DESC
          `;

      const result = await query(sql, [userId]);
      return result.rows;
    } catch (error) {
      logger.error("Error in findSessionsByUserId:", error);
      throw error;
    }
  }

  /**
   * Create a new session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session
   */
  async createSession(sessionData) {
    const {
      userId,
      tokenHash,
      ipAddress = null,
      userAgent = null,
      expiresAt,
    } = sessionData;

    try {
      const sql = `
              INSERT INTO session (user_id, token_hash, ip_address, user_agent, expires_at)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id, user_id as "userId", token_hash as "token",
                        ip_address as "ipAddress", user_agent as "userAgent",
                        expires_at as "expiresAt", created_at as "createdAt",
                        last_used_at as "updatedAt"
          `;

      const result = await query(sql, [
        userId,
        tokenHash,
        ipAddress,
        userAgent,
        expiresAt,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error("Error in createSession:", error);
      throw error;
    }
  }

  /**
   * Update session (typically to extend expiry or update metadata)
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated session
   */
  async updateSession(sessionId, updates) {
    const allowedFields = ["ip_address", "user_agent", "expires_at"];

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

    values.push(sessionId);

    const sql = `
            UPDATE session
            SET ${updateFields.join(", ")}
            WHERE id = $${paramCount}
            RETURNING id, user_id as "userId", token_hash as "token",
                      ip_address as "ipAddress", user_agent as "userAgent",
                      expires_at as "expiresAt", created_at as "createdAt",
                      last_used_at as "updatedAt"
        `;

    try {
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      logger.error("Error in updateSession:", error);
      throw error;
    }
  }

  /**
   * Delete/invalidate a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteSession(sessionId) {
    try {
      const sql = `DELETE FROM session WHERE id = $1`;
      const result = await query(sql, [sessionId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error("Error in deleteSession:", error);
      throw error;
    }
  }

  /**
   * Invalidate all sessions for a user (e.g., on password change)
   * @param {string} userId - User UUID
   * @returns {Promise<number>} Number of sessions invalidated
   */
  async invalidateUserSessions(userId) {
    try {
      const sql = `UPDATE session SET expires_at = NOW() WHERE user_id = $1 AND expires_at > NOW()`;
      const result = await query(sql, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error("Error in invalidateUserSessions:", error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of sessions removed
   */
  async cleanupExpiredSessions() {
    try {
      const sql = `DELETE FROM session WHERE expires_at <= NOW()`;
      const result = await query(sql);
      return result.rowCount;
    } catch (error) {
      logger.error("Error in cleanupExpiredSessions:", error);
      throw error;
    }
  }
}

module.exports = new AuthRepository();
