# AayuCare Architecture Standards

**Last Updated**: 2026-07-04
**Stack**: PostgreSQL, Node.js + Express, React Native + Expo (SDK 55)

## 1. System & Folder Architecture

### Backend (`backend/`)
- **Entry point**: `server.js` (loads env, connects DB, starts HTTP)
- **App setup**: `src/app.js` (pure Express app, no side effects)
- **Config**: `src/config/` (PostgreSQL pool, env vars, `schema.sql`)
- **Modules**: `src/modules/<domain>/` (Domain-driven design: auth, admin, doctor, patient, appointment, etc.)
- **Middleware**: `src/middleware/` (auth, errorHandler, rateLimit, validation)

### Frontend (`frontend/`)
- **Entry point**: `App.js` (Provider stack)
- **Config**: `app.config.js` (Reads `EXPO_PUBLIC_*`)
- **Features**: `src/features/<domain>/` (Screens, components, hooks per domain)
- **Services**: `src/services/` (Axios API clients per feature)
- **State**: `src/store/` (Redux Toolkit + TanStack Query)

---

## 2. Mandatory Architectural Patterns

### 2.1 Backend: Modular Monolith + Service-Repository
Every backend feature MUST follow the exact layered architecture:
1. **Routes** (`*.routes.js`): Maps HTTP methods to controllers, applies Joi validation and RBAC.
2. **Controller** (`*.controller.js`): Parses requests, calls service, sends standardized response via `apiResponse.js`. No business logic.
3. **Service** (`*.service.js`): Contains all business logic, transactions, and rule validation.
4. **Repository** (`*.repository.js`): Executes raw parameterized PostgreSQL queries. Field mappers live here (e.g., `row_shape` to `camelCase`).

### 2.2 Frontend: Feature-Sliced Design
Features are isolated in `src/features/`. 
- **No global components** unless truly generic (e.g., standard Button).
- **Navigation** is strictly decoupled using frozen routes (`src/navigation/routes.js`).

---

## 3. Data Model Strategy

- **Single Source of Truth**: PostgreSQL (17 tables). 
- **Forbidden Technologies**: MongoDB, Mongoose, Redis. (All legacy residues have been purged).
- **Primary Keys**: UUIDs are used for all entities. `hospital_id` is a `VARCHAR(50)` for tenant scoping. User IDs use prefixes (`PAT1`, `DOC1`, `ADM1`) mapped via sequences.
- **Transactions**: Multi-table writes (e.g., booking an appointment + payment) MUST use PostgreSQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`).

---

## 4. API and Contract Standards

### 4.1 Response Envelope
All API responses MUST use the standard envelope from `src/utils/apiResponse.js`:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": { "pagination": { ... } }
}
```

### 4.2 Error Handling
- **Backend**: Use `next(error)`. The centralized `errorHandler.js` intercepts and formats the error securely (never leaking stack traces in production).
- **Frontend**: Handle API errors globally via Axios interceptors, displaying user-friendly messages via Toast.

---

## 5. Security & Multi-Tenancy

- **Authentication**: Handled via Better Auth (`/api/auth/*`).
- **Authorization (RBAC)**: Enforced in routes via `authorizeRole('admin', 'doctor')`.
- **Multi-Tenancy**: EVERY query to PostgreSQL MUST include `hospital_id = $n` to ensure data isolation between hospitals.
- **Data Protection**: Parameterized queries ONLY. No string concatenation in SQL.

---

## 6. Performance & Caching

- **Backend Rate Limiting**: In-memory LRU limits applied per route type (auth, read, write, ai).
- **Backend Queries**: Avoid N+1 query patterns. Use SQL `JOIN` or `WHERE id IN (...)` for batch loading. Ensure pagination (`LIMIT`/`OFFSET`) on all list endpoints.
- **Frontend Caching**: TanStack React Query is the primary cache. Axios includes a 100-entry LRU cache for deduplication.

---

## 7. Definition of Done (Architecture)

1. Zero ESLint warnings or errors (`npm run lint`).
2. Zero TypeScript compiler errors (`tsc --noEmit`).
3. No business logic in controllers (Backend) or screens (Frontend).
4. All database access uses parameterized PostgreSQL queries.
5. All legacy MongoDB/Mongoose structures, syntaxes, or `$gte` paradigms are completely removed.
