#!/usr/bin/env node
"use strict";

/**
 * PostgreSQL initialization sanity check.
 * - Verifies DB connectivity
 * - Prints key table availability for deployment readiness
 */

require("dotenv").config();

const { connectPostgres, query, closePool } = require("../src/config/postgres");

const REQUIRED_TABLES = [
  "users",
  "appointments",
  "payments",
  "patients",
  "doctors",
];

(async () => {
  try {
    await connectPostgres();

    const result = await query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name ASC`
    );

    const existing = new Set(result.rows.map((row) => row.table_name));

    console.log("PostgreSQL schema check (public):");
    console.log(`- total tables: ${result.rows.length}`);

    for (const table of REQUIRED_TABLES) {
      const found = existing.has(table) ? "OK" : "MISSING";
      console.log(`- ${table}: ${found}`);
    }

    console.log("PostgreSQL initialization check completed.");
  } catch (error) {
    console.error(`PostgreSQL initialization check failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    try {
      await closePool();
    } catch {
      // no-op during teardown
    }
  }
})();
