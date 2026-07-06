/**
 * Migration: Add per-role sequences for `users.user_id`
 *
 * Purpose:
 *   Replace the previous SELECT-then-increment algorithm in
 *   `user.repository.js:getNextUserId` with PostgreSQL SEQUENCEs. The
 *   previous algorithm was non-atomic — under concurrent registrations
 *   (e.g. admin bulk-create, walk-in events) two transactions could read
 *   the same `lastNumber`, both produce the same next ID, and one would
 *   hit a 23505 UNIQUE constraint violation on `users.user_id`.
 *
 * Idempotency:
 *   Uses `CREATE SEQUENCE IF NOT EXISTS` and seeds each sequence to
 *   the current MAX(CAST(SUBSTRING(user_id FROM '[0-9]+') AS INTEGER))
 *   so existing rows are honored and re-running the migration is safe.
 *
 * Mapping:
 *   PATx → user_id_pat_seq
 *   DOCx → user_id_doc_seq
 *   ADMx → user_id_adm_seq
 *   SADMx → user_id_sadm_seq
 *
 * Rollback:
 *   Drops the four sequences. The users.user_id column, the existing
 *   rows, and the application-level SELECT-then-increment algorithm are
 *   untouched — reverting this migration leaves the database in a
 *   state compatible with the previous code path.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- Patient sequence: seed to MAX numeric suffix among existing PATx user_ids
    CREATE SEQUENCE IF NOT EXISTS user_id_pat_seq START 1 INCREMENT 1;
    SELECT setval(
      'user_id_pat_seq',
      GREATEST(
        COALESCE(MAX(CAST(SUBSTRING(user_id FROM '[0-9]+') AS INTEGER)), 0),
        1
      ),
      true
    )
    FROM users WHERE user_id LIKE 'PAT%';

    -- Doctor sequence: seed to MAX numeric suffix among existing DOCx user_ids
    CREATE SEQUENCE IF NOT EXISTS user_id_doc_seq START 1 INCREMENT 1;
    SELECT setval(
      'user_id_doc_seq',
      GREATEST(
        COALESCE(MAX(CAST(SUBSTRING(user_id FROM '[0-9]+') AS INTEGER)), 0),
        1
      ),
      true
    )
    FROM users WHERE user_id LIKE 'DOC%';

    -- Admin sequence: seed to MAX numeric suffix among existing ADMx user_ids
    CREATE SEQUENCE IF NOT EXISTS user_id_adm_seq START 1 INCREMENT 1;
    SELECT setval(
      'user_id_adm_seq',
      GREATEST(
        COALESCE(MAX(CAST(SUBSTRING(user_id FROM '[0-9]+') AS INTEGER)), 0),
        1
      ),
      true
    )
    FROM users WHERE user_id LIKE 'ADM%';

    -- Super-admin sequence: seed to MAX numeric suffix among existing SADMx user_ids
    CREATE SEQUENCE IF NOT EXISTS user_id_sadm_seq START 1 INCREMENT 1;
    SELECT setval(
      'user_id_sadm_seq',
      GREATEST(
        COALESCE(MAX(CAST(SUBSTRING(user_id FROM '[0-9]+') AS INTEGER)), 0),
        1
      ),
      true
    )
    FROM users WHERE user_id LIKE 'SADM%';
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP SEQUENCE IF EXISTS user_id_pat_seq;
    DROP SEQUENCE IF EXISTS user_id_doc_seq;
    DROP SEQUENCE IF EXISTS user_id_adm_seq;
    DROP SEQUENCE IF EXISTS user_id_sadm_seq;
  `);
};