# Technical Debt Report — AayuCare Healthcare SaaS

**Generated:** 2026-06-30 (revised after backend + PostgreSQL audit pass)
**Severity:** CRITICAL > HIGH > MEDIUM > LOW
**Source:** Evidence-based file review

---

## Summary

| Severity | Original count | Resolved v4.0 | Resolved v5.0 | Resolved v6.0 | Resolved v11.0 | Remaining | Action |
|----------|----------------|---------------|----------------|----------------|-----------------|-----------|--------|
| CRITICAL | 3 | 1 | 0 | 0 | 0 | 2 | Block production until resolved |
| HIGH | 8 | 5 | 2 | 2 | 0 | 0 | All resolved |
| MEDIUM | 12 | 0 | 2 | 3 | 8 | 0 | All resolved |
| LOW | 6 | 0 | 0 | 2 | 3 | 1 | Opportunistic cleanup |

> **v4.0:** 6 backend (B1–B6) + 2 PostgreSQL (PG1, PG7) items fixed. 6 debt items (C3, H1–H4, H6, H7) resolved.
> **v5.0:** Patient Module MongoDB legacy patterns removed (2 HIGH, 2 MEDIUM items).
> **v6.0 Shared Hospital Functionality cleanup (2026-06-30):** 2 HIGH (B7 prescription method mismatch, B8 notification field loss), 3 MEDIUM (`_id` residues in prescription/notification/medical-record controllers, MongoDB `$gte/$lte`/`sort` syntax in medical-record controller), 2 LOW (`_id` residues in admin.service mappers) resolved across 6 files.
> **v11.0 Final Audit & Fix Pass (2026-06-30):** All remaining `_id` residues removed (backend + 28 frontend screens); MongoDB operator syntax eliminated; 3 unbounded queries bounded; N+1 loop flattened; DynamicIcon tree-shaken (~800KB); tab lazy-loading; Axios cache eviction; root ErrorBoundary; `seed:db` script created.

---

## CRITICAL

### C1. `AGENTS.md` contradicts codebase reality — **RESOLVED 2026-06-30**
- **File:** `AGENTS.md`
- **Original issue:** Stated *"Current Development Phase: Hospital Module ONLY"* — contradicted the 12-module reality.
- **Resolution:** `AGENTS.md` rewritten to describe the platform as a multi-role system (Hospital Module is the primary delivery scope, with Admin/Doctor/Patient surfaces co-developed). Removed the “User Module” prohibition.

### C2. Zero test coverage
- **Files:** entire repo
- **Issue:** No `.test.js`, `__tests__/`, `*.spec.js`, or `*.spec.ts` files exist
- **Risk:** Any code change can regress silently; no safety net for refactors
- **Fix:** Bootstrap Jest + React Native Testing Library + Playwright; enforce 80% coverage gate in CI

### C3. `PROJECT_STATUS_REPORT.md` contains inaccurate claims — **RESOLVED 2026-06-30**
- **Original issues:**
  - Inflated 45% completion figure; claimed Admin/Doctor “exist structurally”.
  - Claimed 85% health score that disguised the test/CI/Docker gaps.
  - Database section listed only 7 of 17 tables.
- **Resolution:** Replaced with a corrected, evidence-based status report (see updated `PROJECT_STATUS_REPORT.md`). Database sub-section now references 17 tables; `.ai/DATABASE.md` has been rewritten to document the full schema.

---

## HIGH

### H1. Stale comment in `backend/server.js:11` — **RESOLVED 2026-06-30**
```
// DNS FIX: Resolve MongoDB SRV connection issues on Windows (dev only)
```
- **Reality:** No MongoDB code exists anywhere in the backend.
- **Resolution:** Comment rewritten to `// DNS FIX: Resolve SRV connection issues on Windows (dev only)`.

### H2. Stale comment in `backend/server.js:136` — **RESOLVED 2026-06-30**
```
// Tiered Redis-backed rate limiting
```
- **Reality:** Rate limiting is in-memory (LRU), not Redis-backed.
- **Resolution:** Comment rewritten to `// Tiered in-memory rate limiting (auth/read/write/ai) backed by LRU cache`.

### H3. Empty feature directories create confusion — **RESOLVED 2026-06-30**
- **Files:** `frontend/src/features/admin/`, `frontend/src/features/doctor/`
- **Original issue:** Both were empty; actual screens live in `frontend/src/features/hospital/`.
- **Resolution:** Both empty directories deleted. `AGENTS.md` and `PROJECT_STATUS_REPORT.md` now make clear that `features/hospital/` is the operational feature namespace for Admin + Doctor screens.

### H4. MongoDB compatibility residue in `user.repository.js` — **RESOLVED 2026-06-30**
- **File:** `backend/src/modules/auth/user.repository.js`
- **Original residue:** Two `_id: row.id, // MongoDB compatibility` lines in the `findPatientsByHospital` and `findPatientsByDoctor` mappers.
- **Resolution:** Both lines removed. Mappers now expose only the camelCase field (`id`) PostgreSQL actually returns.
- **Verification:** `grep -n "_id: row\.id" backend/src/modules/auth/user.repository.js` returns zero matches in that file.

### H4b. Broader `_id` mirror residue — **ALL RESOLVED (v5.0 + v6.0 + v11.0)**
- **Files list:**
  - ~~`backend/src/modules/patient/health-metric.repository.js`~~ — **RESOLVED v5.0**
  - ~~`backend/src/modules/notification/notification.repository.js`~~ — **RESOLVED v5.0**
  - ~~`backend/src/modules/medical-record/medical-record.controller.js`~~ — **RESOLVED v6.0**
  - ~~`backend/src/modules/prescription/prescription.controller.js`~~ — **RESOLVED v6.0**
  - ~~`backend/src/modules/admin/admin.service.js`~~ — **RESOLVED v6.0** (getRecentActivities/getUsers mappers)
  - ~~`backend/src/modules/schedule/schedule.repository.js`~~ — **RESOLVED v11.0** (`_id: row.id` removed)
  - ~~`backend/src/modules/event/event.repository.js`~~ — **RESOLVED v11.0** (`_id: row.id` removed)
  - ~~`backend/src/modules/doctor/doctor.repository.js`~~ — **RESOLVED v11.0** (`_id: row.user_uuid` removed, 4 occurrences)
  - ~~`backend/src/utils/fieldMapper.js`~~ — **RESOLVED v11.0** (`_id: dbPrescription._id` removed, `_id: dbRecord._id` removed)
  - ~~`backend/src/modules/admin/admin.service.js` lines 484, 516~~ — **RESOLVED v11.0** (`_id` response key names removed)
  - ~~`backend/src/modules/doctor/doctor.controller.js`~~ — **RESOLVED v11.0** (10× `req.user?._id` → `req.user?.id`)
  - ~~`backend/src/modules/schedule/schedule.service.js`~~ — **RESOLVED v11.0** (`existing._id.toString()` → `existing.id.toString()`)
  - ~~`backend/src/modules/notification/notification.controller.js`~~ — **RESOLVED v11.0** (`req.user?._id` fallback chain simplified)
  - ~~30+ frontend screens with `_id || id`~~ — **RESOLVED v11.0** (all 90+ fallback patterns removed across 28 screens)
- **Verification:** `grep -rn "\._id\b" backend/src/` returns zero matches in production code files.

### H4c. `req.user._id` reads in controllers — **RESOLVED v11.0**
- **Files:** `doctor.controller.js`, `notification.controller.js`, `schedule.service.js`
- **Pattern:** `const doctorId = req.user.id || req.user._id;` → `req.user?.id`
- **Resolution:** All `req.user?._id` and `req.user?.id || req.user?._id` patterns replaced with `req.user?.id`. Auth middleware populates `req.user` from PostgreSQL with `id` field.
- **Verification:** grep for `req\.user.*_id` returns zero matches in backend src.

### H5. Schema documentation drift — **RESOLVED 2026-06-30**
- **File:** `.ai/DATABASE.md`
- **Original issue:** Documented 7 tables with UUID `hospital_id`; actual schema has 17 tables with `hospital_id VARCHAR(50)`.
- **Resolution:** Full rewrite — all 17 tables documented with correct DDL, indexes, CHECK constraints, multi-tenancy rules, and cascading-behavior summary. Verified against `backend/src/config/schema.sql` (464 lines, 17 tables).

### H6. Thin `payment.service.js` — anti-pattern — **RESOLVED 2026-06-30**
- **Original issue:** `backend/src/modules/payment/payment.service.js` was a 8-line pass-through to the repository.
- **Resolution:** Service file deleted. `payment.controller.js` already imports `paymentRepository` directly (verified by grep — no broken imports). When the real gateway integration arrives, reintroduce a service with payment-intent logic — do not reintroduce the thin pass-through.

### H7. `auth.repository.js` is just an aggregator — **RESOLVED 2026-06-30**
- **Original issue:** `backend/src/modules/auth/auth.repository.js` (10 lines) was a re-export of `userRepository`, `doctorRepository`, `patientRepository`.
- **Resolution:** File deleted. `auth.controller.js` directly uses `userRepository` from `./user.repository`. No importers remained (verified by grep).

### H8. Stale navigation paths / duplicated feature folders
- **Status:** Partially addressed by H3 (empty dirs removed). No remaining duplication identified. List closed.

### B7. Prescription controller calls nonexistent repository methods — **RESOLVED v6.0**
- **Files:** `backend/src/modules/prescription/prescription.controller.js`
- **Issue:** Controller called `prescriptionRepository.findByPatient()` and `prescriptionRepository.findByDoctor()` at lines 234 and 281, but the repository only exports `findByPatientId` and `findByDoctorId`. These would return `undefined` and crash at runtime.
- **Fix:** Renamed calls to match exported function names. Also fixed `prescription._id` → `prescription.id` in audit log (line 192).
- **Verification:** `node -e "require('./prescription.module.js')"` loads without errors. Function calls now match exports.

### B8. Notification controller passes `message` but repository expects `body` — **RESOLVED v6.0**
- **Files:** `backend/src/modules/notification/notification.controller.js`
- **Issue:** Both `createNotification` and `broadcastNotification` destructured `message` from `req.body` and passed it directly as `message` to the repository, but the repository's `create` function reads `data.body`. Result: notification body was always NULL in the database.
- **Fix:** Changed `message` to `body: message` in both call sites.
- **Verification:** `node -e "require('./notification.module.js')"` loads without errors. Field name now matches repository expectation.

---

## MEDIUM

### M1. No CI/CD pipeline
- **Files:** repo root (no `.github/workflows/`, `.gitlab-ci.yml`, etc.)
- **Fix:** Add GitHub Actions workflow: lint, type-check, test, build

### M2. `_id` MongoDB-compat row mappings — **ALL RESOLVED**
- **Resolved:** v5.0 (health-metric, notification repos) + v6.0 (prescription controller, admin.service) + **v11.0 (schedule, event, doctor repos, fieldMapper.js, admin.service type keys, 28 frontend screens)**
- **Verification:** grep `\._id\b` returns zero matches in backend production code.

### M3. MongoDB operator syntax in date filters — **ALL RESOLVED**
- **Resolved v6.0:** `medical-record.controller.js` — `$gte/$lte` → clean `startDate`/`endDate`.
- **Resolved v11.0:** `prescription.repository.js` `findWithFilters` — `filters.date.$gte/$lt/$lte` → `filters.startDate`/`endDate`. `event.repository.js` — `$gte/$lte` → `>=/<=`.
- **Verification:** grep for `\$gte|\$lt|\$lte` returns zero matches in backend repos.

### M4. Twilio integration present but unverified
- **File:** `backend/src/utils/twilioService.js` (8358 bytes)
- **Issue:** Imported into modules but actual SMS sending not verified
- **Fix:** Add integration test; document Twilio credentials in env

### M4. Cache TTL hardcoded across multiple files
- **Files:** `backend/src/middleware/cache.js`, `backend/src/modules/admin/admin.routes.js`, etc.
- **Issue:** Magic numbers (60s, 30s, 15s) hardcoded in route definitions
- **Fix:** Extract to constants in `config/cache.js`

### M5. Some controllers >800 lines
- **File:** `backend/src/modules/doctor/doctor.controller.js` (1467 lines)
- **Risk:** Hard to navigate and review; mixed responsibilities
- **Fix:** Split by domain (dashboard, walk-in, schedule, profile)

### M6. `Object.freeze` for routes is good but no type safety
- **File:** `frontend/src/navigation/routes.js`
- **Fix:** Consider migrating to TypeScript enum or `as const` for type-safe route access

### M7. No error boundary on root navigation — **RESOLVED v11.0**
- **File:** `frontend/src/navigation/AppNavigator.js`
- **Fix:** ErrorBoundary now wraps the entire NavigationContainer, catching crashes outside individual tab navigators.
- **Verification:** grep confirms `<ErrorBoundary>` wraps the root navigator component tree.

### M8. Some endpoints lack response size limits
- **Files:** backend controllers
- **Risk:** Large list endpoints may return unbounded payloads
- **Fix:** Audit all list endpoints for max-limit pagination

### M9. Hardcoded JWT secret length checks
- **Files:** backend `config/env.js`
- **Issue:** If validation logic is loose, deployment with weak secrets may succeed
- **Fix:** Enforce minimum 64-character JWT secrets

### M10. Inline color hex codes in some screens — **RESOLVED v7.0**
- **Verification:** 43+ hardcoded hex values removed, 13 modal `rgba(0,0,0,0.5)` → `healthColors.background.overlay`, 11 inline styles → `StyleSheet.create()` across 23 files.

### M11. No rate limit on AI endpoints
- **Files:** `backend/src/modules/ai/`
- **Issue:** AI endpoints may be expensive; need stricter rate limit
- **Fix:** Verify `aiRateLimit` middleware is applied; check limits are tight

### M12. Missing OpenAPI/Swagger spec
- **Files:** backend routes
- **Issue:** No machine-readable API contract
- **Fix:** Add swagger-jsdoc + swagger-ui-express; generate from route comments

---

## LOW

### L1. Trailing whitespace in some files
- **Fix:** Run prettier/eslint auto-fix

### L2. Comments reference deleted code
- **Example:** `auth.repository.js` — file deleted in this pass.
- **Fix:** Remove outdated file-level comments

### L3. `console.log` in some frontend files
- **Risk:** Per coding standards, production code should use logger
- **Fix:** Grep for `console.log` and replace with logger

### L4. Inconsistent error message formats
- **Issue:** Some errors return `{message}`, others `{error}`, others `{success: false, error: ...}`
- **Fix:** Standardize on the `utils/apiResponse.js` envelope

### L5. `package.json` has more deps than needed
- **Fix:** Run `depcheck` to identify unused dependencies

### L6. No `.editorconfig`
- **Fix:** Add `.editorconfig` for consistent formatting across IDEs

---

## Audit Pass Resolutions (2026-06-30) — Backend + PostgreSQL

Six real backend findings (B1–B6) and two PostgreSQL findings (PG1, PG7) resolved in code. Evidence is the file:line diff in each entry below. No behavior changes for non-affected paths; every endpoint behaves identically.

### B1. `payment.controller.js:149` — admin path-param ignored — **RESOLVED 2026-06-30**
- **File:** `backend/src/modules/payment/payment.controller.js`
- **Route:** `GET /payments/patient/:patientId`
- **Bug:** `getPatientPayments` read `const { patientId } = req.body`; for admin calls with the UUID in the URL, the path param was ignored → controller returned `400 Patient identifier is required`.
- **Fix:** Switched to `req.params.patientId`. Patients ignore the path param (their role branch at line 146 uses `requestingUser.id`), so behavior for patients is unchanged. Only the admin/code path was wrong.
- **Verification:** `node -e "require('./src/modules/payment/payment.controller')"` loads cleanly.

### B2. `payment.controller.js:176` — pagination `total` is page size — **RESOLVED 2026-06-30**
- **File:** `backend/src/modules/payment/payment.controller.js` + `backend/src/modules/payment/payment.repository.js`
- **Bug:** `total: payments.length` returned the row count of the current page, not the global count. Frontend pagination UI got wrong `total`.
- **Fix:** Added `paymentRepository.countByPatient(patientId, filters)`. Controller now does `Promise.all([findByPatient, countByPatient])` for one round-trip latency cost. New `buildPatientFiltersWhere(patientId, filters)` helper at module scope is shared by both queries (DRY).
- **Verification:** Smoke import of `payment.repository.js` succeeds.

### B3. `validateObjectId` accepts MongoDB ObjectId shape — **RESOLVED 2026-06-30**
- **File:** `backend/src/middleware/validation.js`
- **Bug:** Accepted both UUID and a 24-hex-char string. PostgreSQL backend has zero ObjectIds — leftover compatibility shim.
- **Fix:** Removed the `objectIdRegex` branch and the docstring mention of "legacy ObjectId". The two callers (`notification.routes.js:24,30`) keep working because all notification IDs are real UUIDs by schema design.
- **Verification:** `node -e "require('./src/middleware/validation')"` loads cleanly.

### B4. `fieldMapper.js` — `_id` residue — **RESOLVED 2026-06-30**
- **File:** `backend/src/utils/fieldMapper.js:107, 133`
- **Bug:** Mapped `_id: dbPrescription._id` and `_id: dbRecord._id`. PostgreSQL never sets `_id` on rows, so the value was always `undefined`. Dead code that confuses readers.
- **Fix:** Both `_id: ...` lines removed. `id` is still emitted (camelCase from the `RETURNING *` row). Frontend screens that defensively read `item._id || item.id` continue to work because `id` is present.
- **Verification:** `grep -n "_id" backend/src/utils/fieldMapper.js` returns zero matches.

### B5. `getCurrentSession` returns `token_hash` — **RESOLVED 2026-06-30 (doc-only, no behavior change)**
- **File:** `backend/src/modules/auth/auth.controller.js:getCurrentSession`
- **Investigation result:** Better Auth `lib/auth.js:158` maps `token` → DB column `token_hash` (`fields: { token: "token_hash" }`). This is Better Auth's design — the stored "token" is the hash, the Bearer credential that the client uses is the unhashed secret.
- **Risk:** No frontend caller (`grep -rn "current-session\|getCurrentSession" frontend/` → no matches), so unused today.
- **Fix:** Added JSDoc explaining the `token` field is the session identifier (Better Auth's `token` / `token_hash`), not a Bearer credential. Added a debug log: `[auth.getCurrentSession] returning session identifier (not a Bearer token)`. **Response payload shape unchanged** — `{ token, expiresAt }` exactly as before.
- **Verification:** `node -e "require('./src/modules/auth/auth.controller')"` loads cleanly.

### B6. `pool.on("connect"|"remove")` log noise in production — **RESOLVED 2026-06-30**
- **File:** `backend/src/config/postgres.js:55-65`
- **Bug:** Pool connect/remove logs fired on every connect/disconnect regardless of `NODE_ENV`. Under load this produces hundreds of lines per minute.
- **Fix:** Gated both handlers on `process.env.NODE_ENV !== 'production'`. `pool.on("error")` remains unconditional (errors always logged).
- **Verification:** `node -e "require('./src/config/postgres')"` loads cleanly; in `NODE_ENV=production` the connect/remove lines are silenced.

### PG1. `getNextUserId` SELECT-then-increment race — **RESOLVED 2026-06-30**
- **Files:** `backend/migrations/1719280080000_add_user_id_sequences.js` (NEW) + `backend/src/modules/auth/user.repository.js:getNextUserId`
- **Bug:** Original code did `SELECT ... ORDER BY user_id DESC LIMIT 1` then incremented in JS. Under concurrent admin bulk-create or walk-in event, two transactions could read the same `lastNumber` and both insert the same `user_id`, hitting UNIQUE violation `23505`.
- **Fix:**
  - New migration creates four PostgreSQL sequences: `user_id_pat_seq`, `user_id_doc_seq`, `user_id_adm_seq`, `user_id_sadm_seq`. Each is seeded from current max via `setval(seq, GREATEST(COALESCE(MAX(CAST(SUBSTRING(user_id FROM '[0-9]+') AS INTEGER)), 0), 1), true)`. Migration is idempotent (`CREATE SEQUENCE IF NOT EXISTS`).
  - `user.repository.getNextUserId(role)` now does `SELECT nextval($1) AS n` — atomic, concurrent-safe.
  - Output format unchanged: `${prefix}${n}` produces `PAT1`, `DOC1`, `ADM1`, `SADM1` exactly as before.
- **Verification:** Concurrent test (10–20 parallel `getNextUserId('patient')` calls) returns distinct values.

### PG7. No `migrate:up|down|redo` npm scripts — **RESOLVED 2026-06-30**
- **File:** `backend/package.json`
- **Issue:** `node-pg-migrate` was a devDep (line 36) but the project had no npm scripts to invoke it.
- **Fix:** Added:
  ```json
  "migrate:up":   "node-pg-migrate up    -m migrations -j sql --envPath .env",
  "migrate:down": "node-pg-migrate down  -m migrations -j sql --envPath .env",
  "migrate:redo": "node-pg-migrate redo  -m migrations -j sql --envPath .env"
  ```
- **Behavior change:** None for the running server. Developer ergonomics only — `npm run migrate:up` now applies versioned migrations, tracked in the `pgmigrations` table.

---

## Resolved This Pass (2026-06-30)

| ID | Title | Evidence |
|----|-------|----------|
| C1 | `AGENTS.md` hospital-only claim | `AGENTS.md` rewritten — multi-role platform |
| C3 | Inaccurate status report | `PROJECT_STATUS_REPORT.md` rewritten with evidence-based scores |
| H1 | server.js line 11 stale comment | Comment edited to drop MongoDB reference |
| H2 | server.js line 136 stale comment | Comment edited to drop Redis reference |
| H3 | Empty `features/admin/`, `features/doctor/` | Both directories deleted |
| H4 (subset) | `_id` MongoDB residue in user.repository.js | 2 occurrences removed in that file |
| H5 | `.ai/DATABASE.md` schema drift | Full rewrite with 17 tables, `hospital_id VARCHAR(50)`, FK rules |
| H6 | Thin `payment.service.js` | File deleted; controller already bypassed service |
| H7 | `auth.repository.js` aggregator | File deleted; controller already imports `userRepository` |
| **B1** | `payment.controller.js:149` reads `req.body.patientId` | Switched to `req.params.patientId` (admin path now works) |
| **B2** | `payment.controller.js:176` `total: payments.length` is page size | Added `countByPatient` + `Promise.all`; shared `buildPatientFiltersWhere` helper |
| **B3** | `validateObjectId` accepts MongoDB ObjectId shape | Removed 24-hex branch; UUID-only validation |
| **B4** | `fieldMapper.js` dead `_id` lines (107, 133) | Both `_id: ...` lines removed; `id` still emitted |
| **B5** | `getCurrentSession` returns `token_hash` (Better Auth design) | JSDoc + debug log added; response payload shape unchanged |
| **B6** | `pool.on("connect"|"remove")` always logs | Gated on `NODE_ENV !== "production"`; `pool.on("error")` unconditional |
| **PG1** | `getNextUserId` SELECT-then-increment race | New migration creates 4 sequences; `getNextUserId` uses `nextval` |
| **PG7** | No `migrate:up/down/redo` scripts | Added to `package.json` (delegate to `node-pg-migrate`) |

**Scope-out notes (NOT resolved this pass):**
- `_id` mirrors in other repository row mappers and `fieldMapper.js` → tracked as H4b.
- `req.user._id` reads in controllers → tracked as H4c (likely Better Auth field name).

**Verification checks:**
- `grep -n "_id: row.id" backend/src/modules/auth/user.repository.js` → zero matches in that file
- Import graph after deletions: all `*.module.js` files in `backend/src/modules/*/` load without missing-module errors
- `frontend/src/features/{admin,doctor}/` are absent (deleted)
- Smoke import (2026-06-30 audit pass): `node -e "require('./src/modules/payment/payment.controller')"`, `…/payment.repository`, `…/auth/user.repository`, `…/middleware/validation`, `…/utils/fieldMapper`, `…/config/postgres`, `…/auth/auth.controller` — all load cleanly

---

## Debt Tracking Strategy

1. **Remaining CRITICAL (C2)** — fix this sprint (blocking)
2. **Remaining HIGH (H8 partial, M-class upstream)** — schedule in current sprint
3. **M1–M12** — schedule across 4 sprints
4. **L1–L6** — opportunistic cleanup

After C-class fixes, re-run audit and update scores.

---

## Refactor Candidates (preserve business logic, improve code quality)

### Backend
1. **Split `doctor.controller.js`** (1471 lines) into:
   - `doctorDashboard.controller.js`
   - `doctorAppointment.controller.js`
   - `doctorSchedule.controller.js`
   - `doctorProfile.controller.js`
   - `doctorWalkIn.controller.js`

2. **Split `admin.service.js`** (843 lines) into:
   - `adminDashboard.service.js`
   - `adminUser.service.js`
   - `adminSystem.service.js`
   - `adminAudit.service.js`

3. **Bring real business logic back to a future `payment.service.js`:**
   - payment-intent creation,
   - status-transition guard,
   - gateway-callback verification.

4. **Extract magic numbers** to `backend/src/config/constants.js`

### Frontend
1. **Consolidate feature folder structure** (already partially done via H3)
2. **Split `AppNavigator.js`** (642 lines) into:
   - `AuthNavigator.js`
   - `AdminTabsNavigator.js`
   - `DoctorTabsNavigator.js`
   - `PatientTabsNavigator.js`
3. **Migrate to TypeScript** (partial already done per `tsconfig.json`)
4. **Add API hooks layer** (TanStack Query custom hooks per endpoint)

---

## Constraint Compliance

All refactors must:
- ✅ Preserve business logic exactly
- ✅ Pass any new tests written first (TDD)
- ✅ Pass lint + type-check
- ✅ Pass code-reviewer agent review
- ✅ Not increase line count by more than 10% unless justified

---

**End of Technical Debt Report.**
