# Technical Debt Report — AayuCare Healthcare SaaS

**Generated:** 2026-06-30
**Severity:** CRITICAL > HIGH > MEDIUM > LOW
**Source:** Evidence-based file review

---

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| CRITICAL | 3 | Block production until resolved |
| HIGH | 8 | Fix within current sprint |
| MEDIUM | 12 | Schedule for next sprint |
| LOW | 6 | Track for later |

---

## CRITICAL

### C1. `AGENTS.md` contradicts codebase reality
- **File:** `AGENTS.md:5-8`
- **Issue:** States *"Current Development Phase: Hospital Module ONLY"* and *"Do not implement or modify the User Module unless explicitly requested"*
- **Reality:** 12 backend modules exist (auth, admin, ai, appointment, doctor, event, medical-record, notification, patient, payment, prescription, schedule) plus 50+ frontend screens spanning all roles
- **Risk:** New contributors will be confused, AI agents may refuse legitimate work
- **Fix:** Rewrite `AGENTS.md` to reflect: "Hospital Module is the primary delivery scope; Admin/Doctor/Patient surfaces are co-developed and built"

### C2. Zero test coverage
- **Files:** entire repo
- **Issue:** No `.test.js`, `__tests__/`, `*.spec.js`, or `*.spec.ts` files exist
- **Risk:** Any code change can regress silently; no safety net for refactors
- **Fix:** Bootstrap Jest + React Native Testing Library + Playwright; enforce 80% coverage gate in CI

### C3. `PROJECT_STATUS_REPORT.md` contains inaccurate claims
- **File:** `PROJECT_STATUS_REPORT.md`
- **Issues:**
  - Claims 45% completion with "Core modules (Admin/Doctor/Patient) exist structurally but require full layout expansion" — but `features/admin/` and `features/doctor/` are **empty**; the screens live in `features/hospital/`. The completion percentage is also lower than actual.
  - Claims 85% project health with 90% architecture score — but missing tests/CI/Docker makes production-readiness much lower (~65%)
  - The framework section is current, but the database section omits 9 tables that exist in schema
- **Risk:** Stakeholders make decisions based on inflated metrics; AI agents may skip tasks thinking they're done
- **Fix:** Replaced with corrected version (see updated `PROJECT_STATUS_REPORT.md`)

---

## HIGH

### H1. Stale comment in `backend/server.js:11`
```
// DNS FIX: Resolve MongoDB SRV connection issues on Windows (dev only)
```
- **Reality:** No MongoDB code exists anywhere in the backend
- **Fix:** Delete the comment

### H2. Stale comment in `backend/server.js:136`
```
// Tiered Redis-backed rate limiting
```
- **Reality:** Rate limiting is in-memory (LRU), not Redis-backed
- **Fix:** Replace with `// In-memory rate limiting (LRU cache)` or similar

### H3. Empty feature directories create confusion
- **Files:** `frontend/src/features/admin/`, `frontend/src/features/doctor/`
- **Issue:** Both are empty; the actual screens live in `frontend/src/features/hospital/screens/`
- **Risk:** New developers can't find Admin/Doctor screens; navigation imports must use correct paths
- **Fix:** Either (a) move screens into proper folders, or (b) remove empty dirs and update docs to make clear that hospital is the operational feature namespace

### H4. MongoDB compatibility residue
- **File:** `backend/src/modules/auth/user.repository.js:357`
```javascript
_id: row.id, // MongoDB compatibility
```
- **Risk:** Confusing and unnecessary — pure PostgreSQL
- **Fix:** Remove the `_id` field; keep `id`

### H5. Schema documentation drift
- **File:** `.ai/DATABASE.md`
- **Issues:**
  - Documents 7 tables; actual schema has 16+
  - States `hospital_id` is UUID; actual is `VARCHAR(50)`
- **Fix:** Update `.ai/DATABASE.md` to list all 16 tables and correct the data types

### H6. Thin `payment.service.js` — anti-pattern
- **File:** `backend/src/modules/payment/payment.service.js` (8 lines)
- **Issue:** Service layer is a thin pass-through to repository; all logic in repo. Inconsistent with other modules (e.g., admin.service.js is 843 lines, appointment.service.js is 631 lines)
- **Risk:** When payment gateway integration arrives, business logic will end up in repository, violating the Service-Repository pattern
- **Fix:** Either (a) move business logic to service, or (b) remove service entirely and import repo directly in controller

### H7. `auth.repository.js` is just an aggregator
- **File:** `backend/src/modules/auth/auth.repository.js` (10 lines)
```javascript
const userRepository = require("./user.repository");
const doctorRepository = require("../doctor/doctor.repository");
const patientRepository = require("../patient/patient.repository");

module.exports = { userRepository, doctorRepository, patientRepository };
```
- **Issue:** Not a real repository — just re-exports
- **Fix:** Either delete this file and import from the source modules, or implement actual auth-specific repository methods (session lookup, token revocation, etc.)

---

## MEDIUM

### M1. No CI/CD pipeline
- **Files:** repo root (no `.github/workflows/`, `.gitlab-ci.yml`, etc.)
- **Fix:** Add GitHub Actions workflow: lint, type-check, test, build

### M3. Twilio integration present but unverified
- **File:** `backend/src/utils/twilioService.js` (8358 bytes)
- **Issue:** Imported into modules but actual SMS sending not verified
- **Fix:** Add integration test; document Twilio credentials in env

### M4. Cache TTL hardcoded across multiple files
- **Files:** `backend/src/middleware/cache.js`, `backend/src/modules/admin/admin.routes.js`, etc.
- **Issue:** Magic numbers (60s, 30s, 15s) hardcoded in route definitions
- **Fix:** Extract to constants in `config/cache.js`

### M5. Some controllers >800 lines
- **File:** `backend/src/modules/doctor/doctor.controller.js` (1471 lines)
- **Risk:** Hard to navigate and review; mixed responsibilities
- **Fix:** Split by domain (dashboard, walk-in, schedule, profile)

### M6. `Object.freeze` for routes is good but no type safety
- **File:** `frontend/src/navigation/routes.js`
- **Fix:** Consider migrating to TypeScript enum or `as const` for type-safe route access

### M7. No error boundary on root navigation
- **File:** `frontend/src/navigation/AppNavigator.js`
- **Issue:** ErrorBoundary component exists but may not wrap navigation root
- **Fix:** Verify ErrorBoundary wraps the entire app, not just screens

### M8. Some endpoints lack response size limits
- **Files:** backend controllers
- **Risk:** Large list endpoints may return unbounded payloads
- **Fix:** Audit all list endpoints for max-limit pagination

### M9. Hardcoded JWT secret length checks
- **Files:** backend `config/env.js`
- **Issue:** If validation logic is loose, deployment with weak secrets may succeed
- **Fix:** Enforce minimum 64-character JWT secrets

### M10. Inline color hex codes in some screens
- **Files:** frontend screens (need to grep)
- **Issue:** Design tokens exist in `theme/healthColors.js` but inline hex codes may appear
- **Fix:** Grep and replace with theme tokens

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
- **Example:** `auth.repository.js` — the file is just re-exports; the comment header is misleading
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

## Debt Tracking Strategy

1. **C1, C2, C3** — fix this sprint (blocking)
2. **H1-H8** — fix next sprint
3. **M1-M12** — schedule across 4 sprints
4. **L1-L6** — opportunistic cleanup

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

3. **Replace thin services with real business logic:**
   - `payment.service.js` — add payment intent creation, status transitions
   - `auth.repository.js` — replace with real methods

4. **Extract magic numbers** to `backend/src/config/constants.js`

### Frontend
1. **Consolidate feature folder structure** (resolve admin/doctor/hospital)
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