# AayuCare Database Standards

**Last Updated**: 2026-07-04
**Database**: PostgreSQL 15+

## 1. Single Source of Truth
- **Engine**: PostgreSQL is the ONLY database allowed in this project.
- **Legacy Systems**: MongoDB, Redis, and all related syntaxes (e.g., Mongoose object models, `_id` residues, `$gte` / `$lte` queries) have been strictly forbidden and removed. Do NOT reintroduce them.

## 2. Schema and Migrations
- **Schema Location**: The active database schema lives in `backend/src/config/schema.sql` (currently tracking 17 tables).
- **Migrations**: Node-pg-migrate is used. All structural changes MUST be placed in `backend/migrations/` as timestamped SQL files. Never edit `schema.sql` directly without creating a migration.
- **IDs**: Primary keys are strictly `VARCHAR` (usually UUIDs or prefix-based IDs). 
  - `hospital_id` is a `VARCHAR(50)` for tenant isolation.
  - User-facing IDs use atomic sequences: `PAT1`, `DOC1`, `ADM1`. (See `migrations/1719280080000_add_user_id_sequences.js`).

## 3. Query Guidelines
- **Parameterization**: ALL queries must use `$1, $2` parameterization via `pg`. String interpolation (e.g., `` `... WHERE id = ${id}` ``) is a critical security violation.
- **Repository Pattern**: All database interactions are confined to `*.repository.js` files. 
- **Row Mapping**: Responses from `pg` must be mapped from `snake_case` (DB standard) to `camelCase` (JS standard) immediately inside the repository using `fieldMapper.js` or manual mapping.
- **No `_id` Mirrors**: Field mapping always emits `id`. Do not return `{ id: row.id, _id: row.id }`.

## 4. Multi-Tenancy (Hospital Scoping)
- The application operates on a multi-tenant model grouped by hospitals.
- **Enforcement**: Almost every query across the system (except global auth) must include `AND hospital_id = $X` to ensure data isolation.

## 5. Transactions
- For workflows involving multiple inserts/updates (like Payment + Appointment status), use atomic transactions:
  ```javascript
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // ... operations ...
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  ```

## 6. Performance & Indexes
- **Pagination**: All `SELECT` queries that could return multiple rows MUST implement `LIMIT` and `OFFSET`. Unbounded queries are an architectural violation.
- **N+1 Queries**: Flat `JOIN` operations or single `WHERE ... IN (...)` lookups are required over loops of database requests.
