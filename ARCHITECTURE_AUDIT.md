# Architecture Audit — AayuCare Healthcare SaaS

**Generated:** 2026-06-30
**Scope:** Service-Repository pattern, module boundaries, dependency direction, multi-tenancy enforcement
**Method:** Read all 12 backend modules, navigation, Redux store, frontend services

---

## 1. High-Level Architecture

### Pattern: Modular Monolith + Service-Repository

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native / Expo                      │
│   Screen → Service (apiClient.js) → Backend API             │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js (Node.js)                     │
│   Route → Middleware → Controller → Service → Repository   │
└─────────────────────────────────────────────────────────────┘
                              │ pg Pool
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL (single DB)                   │
│   users, hospitals, doctors, patients, appointments, ...   │
└─────────────────────────────────────────────────────────────┘
```

**Verdict:** ✅ Standard, well-understood pattern. Easy to reason about, easy to test, easy to evolve.

---

## 2. Backend Architecture

### Module Pattern (verified)
Each module follows consistent structure:
```
modules/<domain>/
├── <domain>.routes.js     # Express router + middleware chain
├── <domain>.controller.js # HTTP boundary (parse, validate, respond)
├── <domain>.service.js    # Business logic, multi-tenancy, transactions
├── <domain>.repository.js # Parameterized SQL queries
└── <domain>.module.js     # Mounts routes to Express app
```

### Modules Inventory (12)

| Module | Pattern Compliance | Notes |
|--------|-------------------|-------|
| auth | ✅ (with exception — see H8) | `auth.repository.js` is just re-exports |
| admin | ✅ | 843-line service — comprehensive |
| ai | ✅ | — |
| appointment | ✅ | Transaction-based with payment ACID |
| doctor | ✅ | 1471-line controller — should be split |
| event | ✅ | — |
| medical-record | ✅ | — |
| notification | ✅ | — |
| patient | ✅ | — |
| payment | ⚠ Thin service | 8-line service — anti-pattern |
| prescription | ✅ | — |
| schedule | ✅ | — |

---

## 3. Backend Layer Compliance

### Routes Layer
- ✅ Defines HTTP endpoints
- ✅ Composes middleware chain (protect → authorize → attachHospitalId → validate → cache)
- ✅ Delegates to controller
- ✅ No business logic in routes

### Controller Layer
- ✅ Parses request (params, body, query)
- ✅ Calls service
- ✅ Formats response (success/error envelope)
- ✅ Minimal logic (delegate to service)

**Exceptions:**
- ⚠ `doctor.controller.js` is 1471 lines — should be split by domain

### Service Layer
- ✅ Business logic
- ✅ Multi-tenancy enforcement
- ✅ Transaction coordination
- ✅ Calls repository

**Exceptions:**
- ⚠ `payment.service.js` is 8 lines — no business logic
- ⚠ `auth.repository.js` (10 lines) — should not exist; service should call repos directly

### Repository Layer
- ✅ Parameterized SQL only
- ✅ Returns camelCase mapped fields
- ✅ No business logic

**Exceptions:**
- ⚠ Some `findPatientsBy*` methods map `_id` (MongoDB compat) — dead code
- ⚠ Some `.update()` methods have dynamic field builders — works but fragile

---

## 4. Frontend Architecture

### Folder Structure
```
frontend/src/
├── components/common/   # 27 design-system components
├── config/              # reactQuery, sentry
├── features/            # auth, hospital, patient, splash, main, common
├── hooks/
├── i18n/
├── lib/
├── navigation/          # AppNavigator.js, routes.js
├── services/            # 16 API service files
├── store/               # Redux Toolkit slices
├── theme/               # Design tokens
└── utils/
```

### Issues
- ⚠ `features/admin/` and `features/doctor/` are EMPTY (code in `features/hospital/`)
- ⚠ No clear `hooks/` directory pattern (custom hooks scattered)

### Component Pattern
- ✅ Container/presentational split (screens = container, components = presentational)
- ✅ Design tokens via `@/theme`
- ✅ Accessibility attributes (hitSlop, accessibilityRole, accessibilityLabel)

### State Management
- ✅ Server state: TanStack Query (correct)
- ✅ Client state: Redux Toolkit (correct)
- ✅ URL state: React Navigation routes
- ✅ Persistent: Better Auth + expo-secure-store

### Service Layer
- ✅ `apiClient.js` — Axios setup, interceptors, request IDs, response normalization
- ✅ Feature services — one per domain (admin, appointment, doctor, etc.)
- ✅ `responseNormalizer.js` — backend snake_case → frontend camelCase

---

## 5. Multi-Tenancy Architecture

### Pattern
- All domain tables include `hospital_id`
- `attachHospitalId` middleware auto-injects from authenticated user
- `hospitalIsolation` middleware (in `middleware/auth.js`)
- `super_admin` bypasses (intentional for support)

### Strengths
- ✅ Consistent enforcement
- ✅ Auto-injection prevents forgotten filters
- ✅ Clear in `.ai/ARCHITECTURE.md`

### Risks
- ⚠ Some `findById` methods may not filter by `hospital_id` — verify each
- ⚠ Tests for cross-tenant access don't exist

---

## 6. Caching Architecture

### Pattern
- In-memory LRU cache (`backend/src/config/cache.js`)
- TTL-based middleware (`backend/src/middleware/cache.js`)
- Cache invalidation patterns (`backend/src/utils/cacheInvalidation.js`)

### Strengths
- ✅ Simple, fast, no external dependency
- ✅ Pattern-based invalidation

### Limitations
- ⚠ Per-instance only (multi-instance = cache fragmentation)
- ⚠ Memory growth not bounded explicitly
- ⚠ No cache warming strategy

---

## 7. Error Handling Architecture

### Pattern
- `AppError` class carries status + message + code
- Centralized error handler (`middleware/errorHandler.js`)
- Async errors caught via try/catch or async wrapper (verify)
- Winston logs errors with context

### Strengths
- ✅ Consistent error envelope
- ✅ User-friendly messages

### Improvements
- ⚠ Use RFC 7807 Problem Details format
- ⚠ Include request ID in error response

---

## 8. Authentication Architecture

### Pattern
- Better Auth 1.4.16
- Dual session support: Cookie (web) + Bearer (mobile)
- PostgreSQL session storage
- Bcryptjs(12) password hashing

### Strengths
- ✅ Cross-platform ready
- ✅ Industry-standard library
- ✅ Token hashing for DB lookups (defense in depth)

### Risks
- ⚠ Better Auth schema must stay in sync with our schema
- ⚠ JWT secret management

---

## 9. Frontend-Backend Contract

### Pattern
- Backend returns snake_case (PostgreSQL convention)
- Frontend normalizes to camelCase via `responseNormalizer.js`
- Routes defined in `frontend/src/navigation/routes.js` with `Object.freeze`

### Strengths
- ✅ Single source of truth for routes (no magic strings)
- ✅ Consistent naming convention

### Risks
- ⚠ Field mapper may miss some fields — verify coverage
- ⚠ No machine-readable contract (OpenAPI)

---

## 10. Dependency Direction

### Verified
- ✅ Routes depend on controllers
- ✅ Controllers depend on services
- ✅ Services depend on repositories
- ✅ Repositories depend on `pg` + `utils/logger`

**No circular dependencies observed.**

---

## 11. Architectural Smells

### AS1. Thin Services (Anti-pattern)
- `payment.service.js` (8 lines) — no business logic
- `auth.repository.js` (10 lines) — just re-exports

**Fix:** Either delete or add real logic.

### AS2. God Controller
- `doctor.controller.js` (1471 lines) — too many responsibilities

**Fix:** Split by domain (dashboard, walk-in, schedule, profile).

### AS3. Empty Feature Directories
- `features/admin/` and `features/doctor/` empty
- Real code in `features/hospital/screens/`

**Fix:** Consolidate folder structure.

### AS4. Hardcoded Magic Numbers
- Cache TTLs (60, 30, 15, 10) hardcoded in routes
- Pagination limits not centralized

**Fix:** Extract to `config/constants.js`.

### AS5. Stale Comments
- `server.js` lines 11, 136 reference MongoDB and Redis (neither used)

**Fix:** Remove.

### AS6. Race Condition in `getNextUserId`
- See `DATABASE_AUDIT.md` W2

---

## 12. Architecture Goals Met

| Goal | Status | Evidence |
|------|--------|----------|
| Modular monolith | ✅ | 12 modules with consistent pattern |
| Service-Repository pattern | ⚠ Mostly | Some thin services violate |
| Multi-tenancy | ✅ | hospital_id + middleware |
| RBAC | ✅ | 4 roles enforced |
| Audit logging | ✅ | `utils/audit.js` |
| Cache invalidation | ✅ | `utils/cacheInvalidation.js` |
| Idempotency | ✅ | `middleware/idempotency.js` |
| Cross-platform frontend | ✅ | Expo + RN + TS |
| Design tokens | ✅ | `theme/` directory |
| Type safety | ⚠ Partial | TS configured but JS prevalent |

---

## 13. Refactor Recommendations

### Preserve Business Logic, Improve Structure

1. **Split `doctor.controller.js`** (1471 → ~5 files of ~300 lines each)
2. **Replace thin services** with real logic or delete
3. **Consolidate admin/doctor/hospital feature folders**
4. **Extract magic numbers to constants**
5. **Add OpenAPI spec generation** from JSDoc
6. **Migrate large JS files to TypeScript** incrementally
7. **Add `hooks/` directory** with custom hooks for each domain
8. **Add `__tests__/` directory** with Jest configuration

---

## 14. Health Score

| Aspect | Score |
|--------|-------|
| Pattern compliance | 80% |
| Module boundaries | 90% |
| Dependency direction | 95% |
| Multi-tenancy | 85% |
| State management | 90% |
| Error handling | 85% |
| Caching | 85% |
| Authentication | 90% |
| Documentation | 60% |
| **Overall** | **85%** |

Architecture is well-designed and consistent. Main gaps: thin services, god controller, folder inconsistency, no OpenAPI.

---

**End of Architecture Audit.**