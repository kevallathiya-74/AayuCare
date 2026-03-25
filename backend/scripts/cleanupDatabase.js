#!/usr/bin/env node
"use strict";

/**
 * Safe database maintenance cleanup.
 *
 * Default mode is dry-run (non-destructive).
 * To execute cleanup, set:
 *   CONFIRM_DB_CLEANUP=YES_I_UNDERSTAND
 *
 * Safety rules:
 * - Refuses to run destructive path in production
 * - Only purges old operational logs where available
 */

require("dotenv").config();

const { connectPostgres, query, closePool } = require("../src/config/postgres");

const CONFIRM_TOKEN = "YES_I_UNDERSTAND";
const isConfirmed = process.env.CONFIRM_DB_CLEANUP === CONFIRM_TOKEN;
const retentionDays = Number(process.env.DB_LOG_RETENTION_DAYS || 90);

const tableExists = async (tableName) => {
  const result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName]
  );
  return result.rows[0]?.exists === true;
};

(async () => {
  try {
    await connectPostgres();

    const hasAuditLogs = await tableExists("audit_logs");

    if (!isConfirmed) {
      console.log("Dry-run mode: no data was changed.");
      console.log(`Set CONFIRM_DB_CLEANUP=${CONFIRM_TOKEN} to execute cleanup.`);
      console.log(`Configured retention window: ${retentionDays} days`);
      console.log(`audit_logs table detected: ${hasAuditLogs}`);
      return;
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("Refusing to run cleanup in production environment.");
    }

    if (!hasAuditLogs) {
      console.log("No audit_logs table found. Nothing to clean.");
      return;
    }

    const deletion = await query(
      `DELETE FROM audit_logs
       WHERE created_at < NOW() - ($1 || ' days')::interval`,
      [String(retentionDays)]
    );

    console.log(
      `Cleanup complete. Deleted ${deletion.rowCount || 0} rows from audit_logs older than ${retentionDays} days.`
    );
  } catch (error) {
    console.error(`Database cleanup failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    try {
      await closePool();
    } catch {
      // no-op during teardown
    }
  }
})();
