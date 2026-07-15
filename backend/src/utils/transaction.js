const { getClient } = require("../config/postgres");
const logger = require("./logger");

/**
 * PostgreSQL Transaction Helper
 * Provides transaction wrapper for ACID-compliant operations
 */

/**
 * Execute operations within a transaction
 * Automatically commits on success, rolls back on error
 *
 * @param {Function} callback - Async function that receives client and executes queries
 * @returns {Promise<any>} Result from callback
 *
 * @example
 * await withTransaction(async (client) => {
 *   const user = await client.query('INSERT INTO users ...');
 *   const patient = await client.query('INSERT INTO patients ...');
 *   return { user, patient };
 * });
 */
const withTransaction = async (callback) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");
    logger.debug("Transaction BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");
    logger.debug("Transaction COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Transaction ROLLBACK:", error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  withTransaction,
};
