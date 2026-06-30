# AI Continuation Context — AayuCare Healthcare SaaS

**Generated:** 2026-06-30
**Mode:** Evidence-based audit (no fabrication, no estimation)
**Purpose:** Allow any AI agent or developer to resume work immediately.

---

## 1. Current Development Phase

**Phase:** Hospital Module (with parallel Patient + Doctor + Admin surfaces substantially built)
**Branch:** `patient` (per `git status` at session start)
**Main branch:** `main`
**Git user:** darsh
**Last commit:** `f0d2fa6` — `Merge pull request #20 from kevallathiya-74/patient`

> ⚠️ **Conflict to resolve immediately:** `AGENTS.md` states *"Current Development Phase: Hospital Module ONLY"* and *"Do not implement or modify the User Module unless explicitly requested."* This contradicts the actual codebase, which has **fully implemented** Admin, Doctor, and Patient modules (services, controllers, repositories, screens, navigation). Treat `AGENTS.md`'s phase statement as **stale** and the actual code as the source of truth. Update `AGENTS.md` before resuming parallel work.

---

## 2. Current Milestone

| Area | Status | Evidence |
|------|--------|----------|
| Auth (Better Auth + JWT + email/phone/password) | ✅ Production-ready | `backend/src/modules/auth/`, `frontend/src/features/auth/` |
| Backend PostgreSQL schema (16+ tables) | ✅ Complete | `backend/src/config/schema.sql` (464 lines) |
| Hospital Admin screens | ✅ 20+ screens built | `frontend/src/features/hospital/screens/` |
| Doctor screens (dashboard, walk-in, schedule) | ✅ Built (under `features/hospital/screens/`) | `DoctorHomeScreen.js`, `WalkInPatientScreen.js`, `ScheduleAvailabilityScreen.js` |
| Patient screens (dashboard, appointments, AI, records) | ✅ Built | `frontend/src/features/patient/screens/` |
| API modules (12 modules, full controller/service/repository/route) | ✅ Built | `backend/src/modules/` |
| Frontend navigation (role-based, prefetched) | ✅ Built | `frontend/src/navigation/AppNavigator.js` |
| Test suites | ❌ Not implemented | No `__tests__/` or `.test.js` files present |
| Real production database seeded | ❌ Unverified | `seed:db` script referenced in docs but **not defined** in `package.json` |

---

## 3. Project Structure (verified)

```
AayuCare/
├── AGENTS.md                    # ⚠ Stale — says "Hospital Module ONLY"
├── MASTER.md                    # Audit protocol reference
├── PROJECT_STATUS_REPORT.md     # ⚠ Contains inflated claims — needs revision
├── README.md
├── .ai/                         # Design/product docs (PRODUCT, DESIGN, ARCHITECTURE, DATABASE, SECURITY, UI_UX_RULES)
├── backend/
│   ├── package.json             # scripts: start, dev, init:postgres (NO seed:db)
│   ├── server.js                # Express bootstrap (415 lines, has stale MongoDB comment on line 11)
│   └── src/
│       ├── config/              # postgres.js (8179b), schema.sql (464 lines), cache.js, env.js
│       ├── lib/                 # auth.js (Better Auth wrapper)
│       ├── middleware/          # auth.js, hospitalMiddleware.js, validation.js, cache.js, idempotency.js, rateLimit.js, errorHandler.js, requestId.js, cacheHeaders.js, validateRequest.js
│       ├── modules/             # 12 modules: auth, admin, ai, appointment, doctor, event, medical-record, notification, patient, payment, prescription, schedule
│       ├── utils/               # logger.js, audit.js, cacheInvalidation.js, fieldMapper.js, transaction.js, twilioService.js, apiResponse.js
│       └── validators/          # schemas.js (23KB — main Joi), appointmentValidator.js, prescriptionValidator.js, paymentValidator.js, scheduleValidator.js, userProfileValidator.js, aiValidator.js
└── frontend/
    ├── package.json             # Expo SDK 55, RN 0.83.6, React 19.2.0, Reanimated 4.2.1
    ├── app.config.js, babel.config.js
    └── src/
        ├── components/common/   # 27 design-system components
        ├── config/              # reactQuery.js, sentry.js
        ├── features/            # auth, hospital, patient, splash, main, common (admin/doctor dirs are EMPTY)
        ├── hooks/
        ├── i18n/                # locale files
        ├── lib/                 # utils
        ├── navigation/          # AppNavigator.js (642 lines), routes.js (124 lines, Object.freeze)
        ├── services/            # 16 service files
        ├── store/               # Redux Toolkit slices: auth, appointment, health, permission
        ├── theme/               # healthColors, spacing, typography, index
        └── utils/
```

---

## 4. Tech Stack (verified from package.json files)

### Frontend
- **React Native** 0.83.6
- **Expo SDK** 55 (Development Build)
- **React** 19.2.0
- **TypeScript** 5.9.2
- **Reanimated** 4.2.1 + **Worklets** 0.7.4
- **Redux Toolkit** + React Redux
- **TanStack React Query** v5
- **React Navigation** v6 (native, native-stack, bottom-tabs)
- **react-hook-form** + yup
- **i18next** 22.5.1 (locales: en, hi, gu)
- **Better Auth Expo**
- **Sentry** (Expo)
- **lucide-react-native**, **date-fns**, **expo-image**

### Backend
- **Node.js** >=18
- **Express.js** 4.18.2
- **PostgreSQL** (`pg` 8.18.0)
- **Better Auth** 1.4.16
- **JWT** 9.0.3
- **bcryptjs** 3.0.3 (work factor 12)
- **Helmet** 8.1.0
- **express-rate-limit** 8.2.1
- **Joi** 17.13.3, **express-validator** 7.3.1
- **Winston** 3.18.3, **Morgan** 1.10.1
- **node-pg-migrate** 7.0.0 (dev)
- **Twilio** (SMS OTP)

### Database (PostgreSQL ONLY)
- 16+ tables, composite indexes, triggers, multi-tenancy via `hospital_id VARCHAR(50)` (note: NOT UUID as DATABASE.md states)

---

## 5. Completed Features (verified by file presence)

### Authentication
- Better Auth session management (`lib/auth.js`)
- Cookie + Bearer token dual support (`middleware/auth.js`)
- Bcrypt password hashing (work factor 12)
- Role-based access control: `admin`, `doctor`, `patient`, `super_admin`
- Hospital isolation middleware (`hospitalMiddleware.js`)
- Audit log writes (`utils/audit.js`)
- Cache invalidation patterns (`utils/cacheInvalidation.js`)
- Idempotency middleware for write endpoints
- Phone OTP via Twilio (configurable)

### Backend Modules
- **auth** — signin/signup, profile, change password, push token
- **admin** — dashboard stats, user CRUD (with last-admin protection), bulk ops, audit logs, system metrics, security settings, logout-all
- **appointment** — booking with transaction+payment ACID, status machine (scheduled→confirmed→in_progress→completed), walk-in, time-slot generation (9-20h, 30-min)
- **doctor** — dashboard (today/upcoming/completed), walk-in patient registration with Better Auth sync, schedule mgmt (default Mon-Fri 9-12, 14-17), consultation history
- **patient** — profile, list, search, get-by-id
- **payment** — create, find, statistics (thin service — see TECHNICAL_DEBT_REPORT.md)
- **schedule** — doctor day-by-day availability
- **notification** — preferences, push tokens
- **event** — hospital events
- **prescription** — full prescription management (JSONB dosages)
- **medical-record** — records + attachments
- **ai** — symptom checker, health assistant endpoints

### Frontend Screens
- **Splash** — `SplashScreen.js`, `BoxSelectionScreen.js`
- **Auth** — `LoginScreen.js`, `ForgotPasswordScreen.js`
- **Patient** (under `features/patient/screens/`): `PatientDashboard`, `AppointmentBooking`, `MyAppointments`, `MyPrescriptions`, `MyReports`, `MedicalRecords`, `HealthMetrics`, `ProfileScreen`, `NotificationsScreen`, `AIHealthAssistantScreen`, `AISymptomChecker`, `HospitalEventsScreen`, `PharmacyBillingScreen`, `SpecialistCareFinderScreen`, `EmergencyServices`, `DiseaseInfoScreen`, `DoctorProfileViewScreen`, `PatientEditProfileScreen`
- **Hospital/Admin** (under `features/hospital/screens/`): `AdminHomeScreen`, `AdminSettingsScreen`, `AppointmentsScreen`, `ConsultationScreen`, `ConsultationHistoryScreen`, `DoctorHomeScreen`, `DoctorPatientsScreen`, `DoctorProfileScreen`, `EnhancedPrescriptionScreen`, `ManageDoctorsScreen`, `ManagePatientsScreen`, `PharmacyManagementScreen`, `ReportsScreen`, `ScheduleAvailabilityScreen`, `SecuritySettingsScreen`, `TodaysAppointmentsScreen`, `WalkInPatientScreen`, `EditProfileScreen`, `AddDoctorModal`, `AddPatientModal`, `EditDoctorModal`, `EditPatientModal`, `PatientDetailsModal`
- **Common** — `AppointmentsListScreen`
- **Main** — `SettingsScreen`, `SettingsAccessibilityScreen`, `ChangePasswordScreen`

### Frontend Navigation
- `routes.js` — single source of truth, `Object.freeze` for immutability
- `AppNavigator.js` (642 lines) — role-based router
- Role-based screen preload (admin: 6, doctor: 5, patient: 17)
- Query prefetch on auth

### Frontend Services (16 files)
- `apiClient.js` — Axios interceptors, request ID injection, 401 retry, response normalization
- Feature services: activity, admin, ai, appointment, event, healthMetrics, medicalRecord, notification, payment, pharmacy, prescription, schedule
- `responseNormalizer.js` — normalizes backend snake_case → frontend camelCase

### Design System
- 27 components in `components/common/`: Button, Card, Input, Badge, Avatar, AITagline, ChatComposer, CompactActionCard, CustomIcons, DynamicIcon, EmptyState, ErrorBoundary, ErrorRecovery, FilterComponents, LanguageSelector, ListItem, LoadingOverlay, NetworkStatusIndicator, ProgressBar, SearchField, Tabs
- Theme: healthColors, spacing, typography
- Indian healthcare UX tokens: ₹ symbol, Aadhaar formatting, multi-language

---

## 6. Partially Completed Features

| Feature | What's done | What's missing |
|---------|------------|----------------|
| **Payment processing** | Schema, repository, basic controller | Real payment gateway integration (Razorpay/Stripe) |
| **AI assistant** | Backend endpoints, screens exist | Real ML model integration; current appears mock-based |
| **Notifications** | Schema, repository, preference mgmt | FCM/APNS push delivery pipeline |
| **Test coverage** | Repo structured for tests | Zero active tests |
| **i18n** | en, hi, gu JSON files | Translation completeness audit needed |
| **Analytics** | Admin dashboard stats, system metrics | Predictive analytics, custom dashboards |

---

## 7. Pending Features

- **Tests:** Unit, integration, E2E (Playwright for web, Detox for mobile)
- **CI/CD pipeline:** No `.github/workflows/` or `.gitlab-ci.yml` visible
- **Docker/deployment:** No Dockerfile at root, no docker-compose.yml verified
- **Real payment gateway:** UPI/Card integration for Indian market
- **Push notifications:** APNS/FCM live integration
- **Audit log dashboard** with filtering, export
- **Backup/restore** scripts
- **Doctor/Patient directories** in `features/admin/` and `features/doctor/` — currently **EMPTY**; code lives in `features/hospital/` (see ARCHITECTURE_AUDIT.md)

---

## 8. Architecture Summary

### Pattern: Service-Repository + Controller-Routes
- `routes.js` → `controller.js` (HTTP boundary, validation) → `service.js` (business logic, multi-tenancy, transactions) → `repository.js` (parameterized SQL)
- `module.js` registers routes with Express app
- `modules/index.js` aggregates all 12 modules

### Multi-tenancy
- All domain tables include `hospital_id`
- `hospitalMiddleware.js` auto-injects `hospitalId` from authenticated user into `req.query` (GET) or `req.body` (POST/PUT/PATCH/DELETE)
- `super_admin` bypasses isolation
- Patient role is restricted to own resources via `verifyOwnership`

### Caching Strategy
- In-memory LRU (`backend/src/config/cache.js`) for auth tokens, sessions, dashboards
- TTL-based cache middleware (`backend/src/middleware/cache.js`)
- Cache invalidation on mutations via `utils/cacheInvalidation.js`

### Error Handling
- `AppError` class (`middleware/errorHandler.js`) carries status code + message
- Centralized error handler maps errors to standard `{success, error}` envelope
- Logger integration (`utils/logger.js`) — Winston

### Frontend State Strategy
- **Server state:** TanStack Query (caching, refetch, mutations)
- **Client state:** Redux Toolkit (auth slice, appointment slice, health slice, permission slice)
- **Persistent:** Better Auth session + expo-secure-store
- **URL state:** React Navigation routes

---

## 9. Database Summary

### Schema (16+ tables, all in `backend/src/config/schema.sql`)
- `users` — multi-role accounts (admin/doctor/patient/super_admin), UUID PK, custom `user_id` (PAT/DOC/ADM/SADM prefix)
- `hospitals` — tenant root, plan levels (starter/professional/enterprise)
- `doctors` — extends users with specialization, license_number, consultation_fee
- `patients` — extends users with DOB, gender, blood_group, allergies (TEXT[]), chronic_conditions (TEXT[]), emergency_contact
- `appointments` — patient↔doctor visits, status enum, symptoms, notes, JSONB fields
- `prescriptions` — medications in JSONB (dosage, frequency, duration, instructions)
- `medical_records` — diagnosis, attachments references
- `payments` — INR, status (pending/completed/refunded), gateway info
- `schedules` — doctor weekly availability (JSONB slots per day_of_week)
- `notifications` + `notification_preferences`
- `doctor_ratings` — patient→doctor feedback
- `attachments` — file references
- `audit_logs` — actor, action, entity, timestamp, IP
- `health_metrics` — patient vitals over time
- `events` — hospital events
- `session` — Better Auth sessions (token_hash, user_id, expires_at)
- 14 `updated_at` triggers

### Indexes
- Composite: `idx_appointments_patient_date`, `idx_appointments_doctor_date`, `idx_appointments_lookup(hospital_id, appointment_date)`
- FK indexes on all relationships
- Email/phone uniqueness via DB constraint

---

## 10. Authentication Summary

- **Library:** Better Auth 1.4.16
- **Storage:** PostgreSQL `session` table (Better Auth manages rows)
- **Token format:** Bearer JWT (signed) OR hashed session token (for mobile)
- **Password:** bcryptjs, work factor 12 (configured in `auth.service.js`)
- **Two pathways:** Cookie (web) and Bearer (mobile)
- **Refresh:** Implemented via Better Auth's session refresh
- **Logout:** Single + logout-all-devices (admin endpoint)
- **Audit:** All auth events write to `audit_logs`

---

## 11. Known Issues (evidence-backed)

1. **Stale comments in `server.js`:**
   - Line 11: `// DNS FIX: Resolve MongoDB SRV connection issues on Windows (dev only)` — no MongoDB code exists
   - Line 136: `// Tiered Redis-backed rate limiting` — actually uses in-memory LRU
2. **`AGENTS.md` contradiction:** Says "Hospital Module ONLY" but full patient/doctor/admin modules exist
3. **`PROJECT_STATUS_REPORT.md` inaccuracy:** Claims 45% completion with 85% health score, but evidence shows much more is implemented (12 backend modules, 50+ frontend screens, complete schema). The 45% figure appears to undercount substantially.
4. **Empty directories:** `frontend/src/features/admin/` and `frontend/src/features/doctor/` are empty — code lives in `features/hospital/`
5. **`seed:db` script missing:** `backend/package.json` has only `init:postgres`, not `seed:db`
6. **No test suite:** Zero `.test.js` or `__tests__/` files in repo
7. **Thin services:** `payment.service.js` is 8 lines (just re-exports repository) — see TECHNICAL_DEBT_REPORT.md
8. **`_id` field in user.repository.js line 358:** `// MongoDB compatibility` comment + `_id` field still mapped (dead compatibility code)
9. **Schema doc drift:** `.ai/DATABASE.md` documents 7 tables; actual schema has 16+
10. **DATABASE.md says UUID PK:** Actual schema uses `VARCHAR(50)` for `hospital_id`, with UUID only for entity IDs

---

## 12. Technical Debt (high-level)

See **TECHNICAL_DEBT_REPORT.md** for full list. Top items:
- Stale comments (server.js lines 11, 136)
- MongoDB compatibility residue (`_id` field, comments)
- Zero test coverage
- Inconsistent feature folder structure (admin/doctor dirs empty)
- Documentation drift (.ai/DATABASE.md, .ai/PRODUCT.md, AGENTS.md)
- No seed script defined
- No CI/CD pipeline
- No Docker config at root

---

## 13. High Priority Tasks (recommended order)

1. **Update `AGENTS.md`** to reflect actual codebase reality (12 modules, all roles built)
2. **Update `.ai/DATABASE.md`** to reflect 16 tables (not 7)
3. **Remove stale comments** in `server.js`
4. **Move `admin/` and `doctor/` screens** from `features/hospital/screens/` into their proper feature folders, OR consolidate by removing empty `features/admin/` and `features/doctor/` dirs
5. **Delete MongoDB compat residue** in `user.repository.js`
6. **Add `seed:db` script** to `backend/package.json`
7. **Bootstrap test infrastructure:** Jest + React Native Testing Library + Playwright for web
8. **Add CI pipeline** (GitHub Actions: lint, type-check, test, build)
9. **Add Dockerfile + docker-compose** at root
10. **Integrate real payment gateway** (Razorpay recommended for Indian market)

---

## 14. Critical Files (do not modify without review)

| File | Why critical |
|------|--------------|
| `backend/src/config/schema.sql` | Source of truth for entire DB schema |
| `backend/src/lib/auth.js` | Better Auth initialization — must match DB schema |
| `backend/src/middleware/auth.js` | Session validation for ALL protected routes |
| `backend/src/middleware/hospitalMiddleware.js` | Multi-tenancy enforcement |
| `backend/src/config/postgres.js` | Connection pool — affects all DB operations |
| `frontend/src/navigation/AppNavigator.js` | All navigation flow |
| `frontend/src/navigation/routes.js` | Single source of truth for route names |
| `frontend/src/services/apiClient.js` | Axios setup, interceptors, response normalization |
| `frontend/src/store/store.js` + slices | Redux store config |
| `frontend/src/theme/index.js` | Design tokens (colors, spacing, typography) |

---

## 15. Files That May Need Review Before Modification

- `.ai/ARCHITECTURE.md`, `.ai/DATABASE.md`, `.ai/PRODUCT.md`, `.ai/SECURITY.md` — source-of-truth design docs (currently drift from code)
- `backend/server.js` — has stale comments

---

## 16. Project Conventions

### Naming
- camelCase for variables/functions
- PascalCase for components, types
- UPPER_SNAKE_CASE for constants
- snake_case for DB columns
- Custom user IDs: `PAT{n}`, `DOC{n}`, `ADM{n}`, `SADM{n}` (global counter, NOT per-hospital)

### Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`
- Branch from main for features, PR back to main

### Backend Patterns
- Service-repository for ALL modules
- Parameterized SQL only (`$1`, `$2` — NEVER string concat)
- Multi-tenancy enforced at middleware level
- Audit log writes on mutations
- Cache invalidation on mutations
- Idempotency middleware for write endpoints

### Frontend Patterns
- Container/presentational split (screens own logic, components are pure)
- TanStack Query for server state, Redux for client state
- Design tokens via `@/theme` — no hardcoded colors/spacing
- Indian healthcare tokens: ₹, Aadhaar format, multi-language

---

## 17. Coding Standards (from CLAUDE.md rules)

- **Immutability:** Spread operator for updates, no mutation
- **Function size:** <50 lines target, <800 line file target
- **Error handling:** try/catch with explicit error narrowing
- **Input validation:** Joi schemas at boundaries
- **No console.log** in production code
- **No hardcoded secrets** — env vars only
- **No `any` type** in TS — use `unknown` + narrow

---

## 18. Design Standards

- **Primary color:** Teal `#14B8A6` (per `.ai/DESIGN.md`)
- **Secondary color:** Sky `#0EA5E9`
- **Min touch target:** 44×44 (WCAG)
- **Text contrast:** 4.5:1 (WCAG AA)
- **Indian healthcare:** ₹ symbol, Aadhaar format, multi-language (en/hi/gu)

---

## 19. Testing Standards

- **Coverage target:** 80% minimum
- **TDD workflow:** RED → GREEN → IMPROVE
- **Test types required:** Unit, integration, E2E
- **E2E framework:** Playwright (web) — not yet set up

---

## 20. Recommended Next Task

**Update `AGENTS.md` and `.ai/DATABASE.md` to reflect codebase reality** (highest leverage, lowest risk). Then proceed with the High Priority Tasks in section 13 in order.

---

## 21. Recommended Development Order

```
1. Fix documentation drift (AGENTS.md, .ai/*.md)        [low risk, immediate clarity]
2. Clean up server.js stale comments                    [low risk, prevents confusion]
3. Resolve admin/doctor/hospital feature folder naming [medium risk, structural]
4. Add seed:db script                                   [medium risk, unblocks onboarding]
5. Bootstrap Jest test infrastructure                   [medium risk, enables TDD]
6. Add CI pipeline (GitHub Actions)                     [low risk, prevents regressions]
7. Implement real payment gateway (Razorpay)            [high risk, revenue-critical]
8. Implement push notifications (FCM/APNS)              [high risk, engagement-critical]
9. Add Dockerfile + docker-compose                       [medium risk, deployment]
10. Performance: add pagination across all list endpoints [medium risk, scales]
```

---

## 22. Recommended Skills for AI Agents

When working on this codebase, AI agents should:
- Use `Explore` agent for codebase mapping
- Use `code-reviewer` after any code modification
- Use `security-reviewer` before commits touching auth, payments, PHI
- Use `tdd-guide` for new feature work
- Use `architect` for structural changes (multi-tenancy, auth, schema)
- Use `performance-optimizer` for DB query review and bundle analysis
- Use `e2e-runner` (Playwright) for critical flows once test infra is set up

---

## 23. Critical Constraints (from AGENTS.md)

- **Single source of truth:** PostgreSQL. **Forbidden:** MongoDB, Mongoose, Redis, mixed databases
- **Always:** Validate input, sanitize user data, use parameterized queries, encrypt sensitive data, protect PHI, protect medical records
- **Never:** Log secrets, log tokens, expose internal errors, store plaintext passwords

---

## 24. Quick Resume Commands

```bash
# Clone
git clone <repo>
cd AayuCare
git checkout patient

# Backend
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, BETTER_AUTH_SECRET, BETTER_AUTH_URL
npm install
npm run init:postgres  # creates schema
npm run dev            # starts on :5000 (verify port)

# Frontend
cd ../frontend
npm install
npx expo start --clear
```

---

**End of AI Continuation Context. Continue to PROJECT_AUDIT.md for full audit details.**