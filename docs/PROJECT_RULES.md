Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

# AayuCare – Full Project Rules & Regulations

This document defines **mandatory engineering, security, and quality rules**
for the AayuCare application.

All code written by humans or AI tools (GitHub Copilot, ChatGPT, etc.)
**MUST follow these rules strictly**.

This is a **production-grade healthcare application**.
Any violation is considered a **critical defect**.

-must follow online documention for formate, package for frontend, backend, database

---

## 1. Project Identity

- Project Name: AayuCare
- Domain: Healthcare / Medical Application
- Platforms:
  - Android
  - iOS
- Tech Stack:
  - React Native (Expo)
  - Redux Toolkit
  - Node.js
  - Express
  - MongoDB Atlas

---

## 2. Absolute Core Principles

1. No temporary fixes.
2. No silent failures.
3. No repeated runtime errors.
4. Root cause must always be fixed.
5. One global change must update the entire app.
6. User safety and data integrity are top priority.

If a solution does **not permanently prevent the same issue**, it is NOT acceptable.

---

## 3. Single Source of Truth (MANDATORY)

Each global concern MUST exist in **exactly one file**:

| Concern | File |
|------|------|
| App Configuration | `src/config/appConfig.js` |
| Theme System | `src/theme/index.js` |
| Storage | `src/utils/appStorage.js` |
| API Client | `src/api/apiClient.js` |
| Auth Client | `src/auth/authClient.js` |

❌ Duplicate implementations are forbidden  
❌ Partial abstractions are forbidden  
✅ One file controls the entire system

---

## 4. Naming Rules (CRITICAL)

### ❌ Forbidden Generic Names
These names MUST NEVER be used:
- storage
- utils
- helpers
- data
- config
- theme
- client

### ✅ Approved Explicit Names
- appStorage
- appConfig
- apiClient
- authClient
- themeSystem

Generic names cause runtime shadowing and production crashes.

---

## 5. Storage Rules (Zero Tolerance)

1. Only one storage abstraction is allowed:
   - `src/utils/appStorage.js`
2. Direct usage of `AsyncStorage` outside this file is forbidden.
3. Browser APIs are forbidden:
   - ❌ localStorage
   - ❌ sessionStorage
   - ❌ window.*
4. Storage access must:
   - Be explicitly imported
   - Fail safely
   - Never crash the app
5. Medical or sensitive data must never be logged.

---

## 6. Redux & State Management Rules

1. Reducers must always be **pure**.
2. Side effects allowed ONLY in:
   - Thunks
   - Service layers
3. Redux thunks may ONLY use:
   - `dispatch`
   - `getState`
   - `rejectWithValue`
4. Thunks must NEVER destructure:
   - storage
   - config
   - utils
   - extra
5. Auth initialization must:
   - Run once per app launch
   - Never loop
   - Never retry silently

---

## 7. Auth & Session Rules

1. Authentication must use real backend APIs.
2. Tokens must be stored using `appStorage`.
3. Logout must fully clear:
   - Auth state
   - Storage
4. No auth logic inside UI components.
5. Session restore must:
   - Be guarded
   - Fail safely
   - Never crash the app

---

## 8. API & Backend Integration Rules (EXTENDED)

### 8.1 API Client Rules
1. All API calls must go through `apiClient`.
2. Base URL must come from `appConfig`.
3. Headers must be set centrally:
   - `Content-Type`
   - `Authorization`
   - `Accept`
4. No screen or slice may call `fetch` or `axios` directly.

### 8.2 Request Validation (Backend)
1. Every API request must validate:
   - Required fields
   - Data types
   - Data length
2. Invalid requests must return proper HTTP codes:
   - 400 – Bad Request
   - 401 – Unauthorized
   - 403 – Forbidden
   - 404 – Not Found
   - 429 – Too Many Requests
   - 500 – Server Error

---

## 9. API Rate Limiting & Security (MANDATORY)

1. Backend must implement rate limiting:
   - Protect auth endpoints
   - Prevent brute-force attacks
2. Example limits:
   - Auth: limited attempts per IP
   - APIs: request-per-minute limit
3. All APIs must include:
   - Proper CORS headers
   - Secure headers (no sensitive exposure)
4. Secrets must never be committed to Git.

---

## 10. Error Handling & User Messaging Rules

### 10.1 Backend Errors
1. Backend must return **structured error responses**.
2. Error messages must be:
   - Clear
   - Non-technical
   - Safe (no internal details)

### 10.2 Frontend Errors
1. Frontend must show **user-friendly messages**.
2. Raw backend or JS errors must NEVER be shown to users.
3. Errors must guide the user:
   - What happened
   - What to do next

---

## 11. Theme & UI Rules (Global Consistency)

1. Colors, fonts, spacing, and sizes must come ONLY from:
   - `src/theme/index.js`
2. Inline hardcoded styles are forbidden.
3. UI must work consistently across:
   - Android
   - iOS
   - Different screen sizes
4. Accessibility is mandatory:
   - Readable fonts
   - Proper contrast
   - Touch-friendly components

---

## 12. Navigation Rules

1. Every navigation route must point to an existing screen.
2. No dead routes or unused screens.
3. Navigation must respect auth state.
4. No navigation logic inside reducers.

---

## 13. Logging Rules

1. Logs allowed only in development.
2. Logs must never include:
   - Tokens
   - Medical data
   - User PII
3. Production logs must be minimal and sanitized.

---

## 14. Cleanup & Code Health Rules

1. Unused files must be deleted.
2. Duplicate code must be merged.
3. Unused exports must be removed.
4. Folder structure must remain clean and intentional.

Health check must show:
- Syntax Errors: 0
- Runtime Errors: 0
- Duplicate Code: 0
- Unused Exports: 0

---

## 15. AI / Copilot Usage Rules

1. This file is mandatory context for:
   - GitHub Copilot
   - ChatGPT
2. AI must:
   - Update existing files if they exist
   - Create new files only if necessary
3. AI must NOT:
   - Introduce duplicate abstractions
   - Use generic names
   - Add temporary fixes
4. Repeated errors indicate rule violation.

---

## 16. Production Readiness Rules

Before deployment:
1. App must run on real devices via QR scan.
2. No red screens.
3. Frontend → Backend → Database must work end-to-end.
4. One global change must affect the entire app.
5. Security and validation must be verified.

---

## 17. Final Absolute Rule

> **If a solution does not permanently prevent the same error,
> it is not acceptable for AayuCare.**

---

🔐 18. Session Management Rules (MANDATORY – APP-WIDE)

Session handling in AayuCare is security-critical.
All authentication, authorization, and user persistence must follow these rules.

18.1 Single Session Authority (STRICT)

The application must have exactly one session authority.

Session state must be controlled ONLY by:

authClient

Redux authSlice

UI components must NEVER:

Read tokens directly

Write to storage

Infer session state manually

❌ No component-level session logic
❌ No duplicated session checks
✅ One centralized session lifecycle

18.2 Session Lifecycle (END-TO-END)

Every user session MUST follow this lifecycle:

App Launch

App initializes

Session restore runs ONCE

Session Restore

Token read from appStorage

Token validated (locally + backend)

Authenticated

User data loaded from backend

Session marked active

Session Expiry / Logout

Token invalidated

Storage cleared

Redux state reset

Unauthenticated State

User redirected safely

No crashes

No stale data

Skipping any step is forbidden.

18.3 Storage Rules for Session Data

Only appStorage may access persisted session data.

Allowed session keys must be explicitly defined (example):

AUTH_TOKEN

REFRESH_TOKEN

USER_ID

Session data must:

Be validated before use

Be cleared on logout

Never be assumed valid

❌ Blind reads from storage are forbidden.

18.4 Token Handling Rules (CRITICAL)

Tokens must NEVER:

Be logged

Be shown in UI

Be passed via navigation params

Tokens must ALWAYS:

Be attached via apiClient headers

Be refreshed or invalidated correctly

Expired tokens must:

Trigger logout

Not cause infinite retries

Silent retry loops are forbidden.

18.5 Backend Session Validation Rules

Every protected API must:

Validate token

Validate user existence

Validate session state

Backend must reject:

Expired tokens

Revoked tokens

Tampered tokens

Backend must return:

401 for invalid sessions

Clear error codes (no vague messages)

18.6 Frontend Reaction to Session Errors

On 401 / 403:

Session must be cleared

User redirected to auth flow

UI must show:

Friendly message

Clear next action

App must NEVER:

Crash

Freeze on splash screen

Enter infinite loading state

18.7 Session Initialization Rules (IMPORTANT)

Session initialization must:

Run only once per app launch

Be guarded by a flag (e.g. authInitialized)

Multiple session initializations are forbidden.

Session init must:

Always resolve (success or failure)

Never block navigation forever

This rule exists to prevent:

Splash screen loops

[runtime not ready] errors

18.8 Navigation & Session Coupling Rules

Navigation must ALWAYS respect session state.

Protected screens must:

Be inaccessible when unauthenticated

Session changes must:

Immediately reflect in navigation

Navigation logic must NOT live in:

Redux reducers

API clients

18.9 Session Cleanup Rules (ZERO TOLERANCE)

On logout or session failure, ALL of the following MUST happen:

Clear Redux auth state

Clear session storage

Cancel in-flight API requests

Reset sensitive cached data

Redirect user safely

Partial cleanup is forbidden.

18.10 Session Error Prevention Rules

Repeated session-related errors indicate:

Architectural violation

Any recurring session error must:

Be traced to root cause

Be fixed permanently

Temporary guards (try/catch only) are forbidden
unless root cause is removed.

18.11 Production Session Validation Checklist

Before release, verify:

App cold start restores session correctly

Expired token logs user out cleanly

Backend rejects invalid tokens

No infinite splash screen

No runtime session errors

QR scan → real device works correctly

If any check fails → release is blocked.

18.12 Final Session Rule (ABSOLUTE)

If a session bug can reappear after a restart,
the fix is NOT acceptable for AayuCare.


---

## 19. Backend Architecture Rules (MANDATORY)

### 19.1 Repository Pattern (STRICT)

All database access MUST follow the repository pattern:

```
Controllers → Services → Repositories → Database
```

**Rules:**
- **Controllers**: HTTP handling, request/response only
- **Services**: Business logic, orchestration only
- **Repositories**: Pure data access, NO business logic
- **Database**: PostgreSQL/MongoDB/Redis

❌ Direct model access in controllers is forbidden
❌ Business logic in repositories is forbidden
✅ Clean separation of concerns is mandatory

### 19.2 Transaction Pattern (ACID Compliance)

All critical operations MUST use atomic transactions:

**Required for:**
- Appointment + Payment creation
- User + Profile creation
- Appointment cancellation + Refund
- Any multi-table operation

**Implementation:**
```javascript
const result = await withTransaction(async (client) => {
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO patients ...');
  // Both succeed or both fail
});
```

❌ Partial data commits are forbidden
❌ Manual rollback logic is forbidden
✅ Use transaction helpers in `src/utils/transaction.js`

### 19.3 Caching Strategy (MANDATORY)

All GET routes MUST implement caching:

**Caching TTL Rules:**
- **Public data**: 300s (5 min) - Events, Doctor lists
- **User data**: 120s (2 min) - Profiles, Medical records
- **Dynamic data**: 30-60s - Appointments, Search results
- **Real-time data**: 10s - Notifications, Unread counts
- **Critical data**: 10s - System health, Metrics

**Cache Invalidation:**
- ALL write operations (POST/PUT/PATCH/DELETE) MUST invalidate related cache
- Use pattern-based invalidation: `cache:doctors:*`

**Implementation:**
```javascript
// GET - Cache results
router.get('/doctors', cacheMiddleware(300), getDoctors);

// POST - Invalidate cache
router.post('/doctors', createDoctor, invalidateCache('cache:doctors:*'));
```

❌ Uncached GET routes are forbidden
❌ Missing cache invalidation is forbidden
✅ Use middleware from `src/middleware/cache.js`

### 19.4 Validation Flow (ZERO TOLERANCE)

ALL API routes MUST validate input:

**Validation Requirements:**
- Schema validation via Joi
- Field type checking
- Field length limits
- Email/Phone format validation
- UUID/ID format validation

**Implementation:**
```javascript
router.post(
  '/appointments',
  validateBody(createAppointmentSchema),
  createAppointment
);
```

❌ Unvalidated routes are forbidden
❌ Inline validation is forbidden
✅ Use schemas from `src/validators/schemas.js`

---

## 20. Performance & Optimization Rules

### 20.1 Database Connection Pooling (MANDATORY)

**PostgreSQL:**
- Max connections: 20
- Min connections: 5
- Idle timeout: 30s

**MongoDB:**
- Max connections: 10
- Min connections: 5

**Redis:**
- Max retry: 3
- Retry delay: 100ms

❌ Unbounded connections are forbidden
❌ Connection leaks are forbidden
✅ Always return connections to pool

### 20.2 Query Optimization Rules

ALL database queries MUST:
- Use parameterized statements (SQL injection prevention)
- Use indexes on foreign keys
- Use indexes on search columns
- Limit result sets (pagination)

**Forbidden:**
- SELECT * without LIMIT
- N+1 query problems
- Unindexed WHERE clauses on large tables

### 20.3 API Response Time Rules

**Maximum response times:**
- GET requests: 200ms
- POST requests: 500ms
- Complex queries: 1000ms

If exceeded:
- Add caching
- Optimize query
- Add database indexes

---

## 21. Security & Validation Rules (EXTENDED)

### 21.1 SQL Injection Prevention (ZERO TOLERANCE)

ALL PostgreSQL queries MUST use parameterized statements:

```javascript
// ✅ CORRECT
query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ FORBIDDEN
query(`SELECT * FROM users WHERE email = '${email}'`);
```

❌ String concatenation in queries is forbidden
❌ Template literals in queries are forbidden

### 21.2 Input Sanitization Rules

ALL user input MUST be sanitized:

**Required sanitization:**
- Email: Format validation + lowercase
- Phone: Number extraction + format validation
- Search queries: Regex escape
- File uploads: Type + size validation

❌ Raw user input in queries is forbidden
❌ Unescaped regex patterns are forbidden

### 21.3 Rate Limiting Rules (MANDATORY)

ALL API endpoints MUST implement rate limiting:

**Default limits:**
- General APIs: 100 requests / 15 min
- Auth endpoints: 5 attempts / 15 min
- Search endpoints: 30 requests / min

**Implementation:**
- Use Redis for rate limit tracking
- Return 429 status when exceeded
- Include retry-after header

### 21.4 Session Security Rules

Sessions MUST be:
- Stored in Redis (NOT in-memory)
- Invalidated on logout
- Expired after 7 days
- Revocable (blacklist support)

❌ JWT in localStorage is forbidden on web
❌ Infinite session duration is forbidden
✅ Use Redis session store

---

## 22. Monitoring & Logging Rules (PRODUCTION)

### 22.1 Structured Logging (MANDATORY)

ALL logs MUST be structured (JSON):

```javascript
logger.info('User login', {
  userId: user.id,
  email: user.email,
  timestamp: new Date(),
  ip: req.ip
});
```

**Log Levels:**
- `error`: System failures, exceptions
- `warn`: Recoverable issues
- `info`: Important business events
- `debug`: Development only

❌ console.log in production is forbidden
❌ Unstructured logs are forbidden

### 22.2 Sensitive Data in Logs (ZERO TOLERANCE)

Logs MUST NEVER contain:
- Passwords (plain or hashed)
- Tokens (JWT, API keys)
- PII (personal identifiable information)
- Medical records
- Payment information

**Violation = Critical Security Breach**

### 22.3 Audit Trail Rules (MANDATORY)

ALL critical operations MUST be logged to `audit_logs` table:

**Required audit events:**
- User registration/login/logout
- Profile updates
- Appointment creation/cancellation
- Medical record creation/modification
- Payment transactions
- Admin actions

**Audit log MUST include:**
- User ID
- Action performed
- Timestamp
- IP address
- User agent
- Old/new values (for updates)

### 22.4 Error Tracking Rules

ALL errors MUST be tracked:

**Server errors (500):**
- Log full stack trace
- Log request context
- Alert on repeated errors

**Client errors (400):**
- Log error type
- Log request data (sanitized)

❌ Silent failures are forbidden
❌ Untracked exceptions are forbidden

---

## 23. Database Schema Rules (CRITICAL)

### 23.1 PostgreSQL Schema Requirements

**ALL tables MUST have:**
- UUID primary key (NOT auto-increment)
- `created_at` timestamp (automatic)
- `updated_at` timestamp (automatic via trigger)
- Proper foreign key constraints
- Proper indexes on foreign keys

**Table naming:** snake_case (users, appointments, medical_records)
**Column naming:** snake_case (user_id, appointment_date, created_at)

### 23.2 MongoDB Schema Requirements

**Use MongoDB ONLY for:**
- Document-based data (medical records)
- Nested/flexible structures
- AI analysis results
- Historical logs

❌ Relational data in MongoDB is forbidden
❌ Unnormalized duplicate data is forbidden

### 23.3 Data Migration Rules

When migrating data:
- Use transactions
- Verify data integrity
- Maintain referential integrity
- Log migration progress
- Have rollback plan

❌ Direct database manipulation is forbidden
✅ Use migration scripts

---

## 24. Scalability Rules (10k+ Users)

### 24.1 Load Management

Application MUST handle:
- 10k+ concurrent users
- 1000 requests/minute
- 50 concurrent database connections
- 100MB Redis memory

**Load testing required before production**

### 24.2 Database Optimization for Scale

**Required optimizations:**
- Connection pooling (implemented)
- Query result caching (implemented)
- Database indexes on all foreign keys
- Pagination on all list endpoints
- Lazy loading for large datasets

### 24.3 API Design for Scale

**ALL list endpoints MUST support:**
- Pagination (limit/offset or cursor-based)
- Filtering
- Sorting
- Field selection

**Response size limits:**
- Single record: 100KB max
- List response: 1MB max

❌ Unbounded result sets are forbidden
❌ Missing pagination is forbidden

### 24.4 Frontend Performance Rules

**UI MUST maintain:**
- 60 FPS scrolling
- < 100ms tap response
- Smooth animations
- Proper loading states

**Required:**
- Lazy loading for lists
- Image optimization
- Offline support for critical features

---

## 25. Deployment & Production Rules

### 25.1 Environment Separation (MANDATORY)

**Required environments:**
- Development (local)
- Staging (pre-production)
- Production (live)

**Each environment MUST have:**
- Separate database
- Separate Redis instance
- Separate environment variables
- Separate logs

❌ Sharing databases across environments is forbidden

### 25.2 Health Check Rules

`/health` endpoint MUST return:
- Database connection status (PostgreSQL, MongoDB, Redis)
- Server status
- Version information
- Uptime

**Health check MUST:**
- Respond within 1 second
- Not expose sensitive information
- Be monitored continuously

### 25.3 Graceful Shutdown Rules

Server MUST:
- Close database connections
- Finish in-flight requests
- Flush logs
- Clear temporary data

❌ Force shutdown is forbidden
✅ Handle SIGTERM/SIGINT properly

---

## 26. Code Quality Rules

### 26.1 Repository Method Standards

ALL repository methods MUST:
- Return consistent types
- Handle errors properly
- Use parameterized queries
- Include JSDoc comments

**Naming convention:**
```javascript
// ✅ CORRECT
findById(id)
findByEmail(email)
create(data)
update(id, data)
delete(id)

// ❌ FORBIDDEN
get(id)
save(data)
remove(id)
```

### 26.2 Service Layer Standards

Services MUST:
- Use repositories (never direct DB access)
- Implement business logic
- Use transactions for atomic operations
- Validate business rules

❌ Database queries in services are forbidden
✅ Delegate data access to repositories

### 26.3 Controller Standards

Controllers MUST:
- Be thin (orchestration only)
- Use services for business logic
- Return consistent response format
- Handle errors via middleware

**Response format:**
```javascript
{
  status: 'success' | 'error',
  message: string,
  data: object | array
}
```

---

## 27. Final Production Rules

### 27.1 Pre-Deployment Checklist

Before ANY deployment:
- ✅ All tests passing
- ✅ No console.log statements
- ✅ All environment variables set
- ✅ Database migrations run
- ✅ Health check responding
- ✅ Error tracking configured
- ✅ Logs rotating properly
- ✅ Rate limiting active
- ✅ Caching working
- ✅ Redis connected

### 27.2 Zero Downtime Rules

Production updates MUST:
- Use rolling deploys
- Maintain backward compatibility
- Have rollback plan
- Be tested in staging first

❌ Direct production database changes are forbidden
❌ Breaking API changes without versioning are forbidden

---

## 28. Custom AayuCare Rules

### 28.1 UI/UX Consistency
- Proper maintain UI for frontend design across all screens
- Consistent color scheme from theme system
- Responsive design for all device sizes
- Proper loading states and error handling

### 28.2 Database Efficiency
- Only create needed database collections
- No unused tables or collections
- Regular cleanup of temporary data
- Proper indexing for 200+ concurrent users

### 28.3 Traffic & Load Management
- Application MUST handle 10k+ concurrent active users
- No app crashes under load
- Proper connection pooling
- Cache frequently accessed data
- Graceful degradation when services unavailable

### 28.4 Data Integrity
- Medical data accuracy is critical
- All financial transactions MUST use atomic operations
- Appointment data MUST be consistent across systems
- No orphaned records

---

## 29. Database Structure & Integrity Rules (ENFORCED)

### 29.1 Foreign Key Constraints (MANDATORY)

Database MUST maintain exactly 8 foreign key constraints:

**CASCADE DELETE (Auto-delete profiles):**
- doctors.user_id → users.id (ON DELETE CASCADE)
- patients.user_id → users.id (ON DELETE CASCADE)

**RESTRICT (Prevent deletion):**
- appointments.patient_id → users.id (ON DELETE RESTRICT)
- appointments.doctor_id → users.id (ON DELETE RESTRICT)
- payments.appointment_id → appointments.id (ON DELETE RESTRICT)
- payments.patient_id → users.id (ON DELETE RESTRICT)
- payments.doctor_id → users.id (ON DELETE RESTRICT)

**SET NULL (Preserve history):**
- appointments.cancelled_by → users.id (ON DELETE SET NULL)

**Verification Command:**
```bash
node backend/verify-postgres.js
```

❌ Duplicate constraints are forbidden
❌ Missing foreign keys are forbidden
✅ Exactly 8 constraints must exist
✅ All foreign key columns must be indexed

### 29.2 Audit Logging (HIPAA Compliance)

ALL critical operations MUST be logged to `audit_logs` table:

**Required Table Structure:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Required Indexes:**
- idx_audit_logs_user_id (user_id)
- idx_audit_logs_entity (entity_type, entity_id)
- idx_audit_logs_created_at (created_at)
- idx_audit_logs_action (action)

**Must Track:**
- user_register, user_login, user_logout
- profile_update
- appointment_create, appointment_cancel, appointment_complete
- payment_create, payment_refund
- medical_record_view, medical_record_create, medical_record_update
- prescription_create
- admin_action, role_change

**Verification:**
```bash
psql -U postgres -d aayucare_db -c "SELECT COUNT(*) FROM audit_logs;"
```

❌ Operations without audit log are forbidden
❌ Missing audit_logs table blocks deployment
✅ All sensitive actions must be tracked

### 29.3 Soft Delete Pattern (STATUS-BASED)

AayuCare uses **status-based soft delete** (NOT is_deleted column):

**Appointments:**
```sql
status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
cancellation_reason TEXT
cancelled_by UUID REFERENCES users(id)
```

**Payments:**
```sql
status IN ('pending', 'processing', 'completed', 'failed', 'refunded')
refunded_at TIMESTAMP
refund_amount DECIMAL(10, 2)
```

**Why Status-Based:**
- ✅ Explicit business logic (cancelled != deleted)
- ✅ Audit trail preserved (cancelled_by tracks user)
- ✅ No need to filter is_deleted=false everywhere
- ✅ HIPAA compliant (appointments never truly deleted)
- ✅ Query performance (status indexed)

❌ Adding is_deleted column is forbidden
❌ Hard deleting appointments/payments is forbidden
✅ Use status transitions for lifecycle management

### 29.4 Table Partitioning Strategy (SCALABILITY)

**When to Implement Partitioning:**

**Thresholds:**
- appointments table: > 1,000,000 rows
- audit_logs table: > 5,000,000 rows
- Query times: > 1 second consistently

**Tables to Partition (by date):**
1. appointments (by appointment_date)
2. payments (by created_at)
3. audit_logs (by created_at)

**Implementation Example:**
```sql
-- Convert appointments to partitioned table
CREATE TABLE appointments_partitioned (
  LIKE appointments INCLUDING ALL
) PARTITION BY RANGE (appointment_date);

CREATE TABLE appointments_y2026m01 PARTITION OF appointments_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE appointments_y2026m02 PARTITION OF appointments_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- Repeat for each month
```

**Current Status:**
- ⏳ Partitioning NOT needed yet (< 1M rows)
- ✅ Proper indexes exist (date, date_time, doctor_date)
- ✅ Query performance < 200ms with current scale

❌ Premature partitioning is forbidden
✅ Monitor row counts monthly
✅ Implement partitioning before performance degrades

### 29.5 Database Health Monitoring (WEEKLY)

**Required Weekly Checks:**

```bash
# 1. Verify foreign key count
psql -U postgres -d aayucare_db -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';"
# Expected: 8

# 2. Check for orphaned records
node backend/verify-postgres.js
# Expected: 0 orphaned records

# 3. Review audit log entries
psql -U postgres -d aayucare_db -c "SELECT action, COUNT(*) FROM audit_logs GROUP BY action ORDER BY COUNT(*) DESC;"

# 4. Monitor table sizes
psql -U postgres -d aayucare_db -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

**Alert Thresholds:**
- Foreign keys ≠ 8 → CRITICAL
- Orphaned records > 0 → HIGH
- appointments > 1M rows → Implement partitioning
- Query time > 500ms → Add indexes/optimize

**Monthly Tasks:**
- Review audit log growth
- Archive old audit logs (> 2 years)
- Vacuum and analyze tables
- Update database statistics

### 29.6 Database Migration Rules (ZERO DOWNTIME)

**Schema Changes MUST:**

1. **Create migration script** in `backend/migrations/YYYYMMDD_description.sql`
2. **Test in development** environment first
3. **Verify FK impact** - Check CASCADE/RESTRICT behavior
4. **Run in staging** with production-like data
5. **Schedule maintenance window** or use online DDL
6. **Have rollback plan** ready

**Example Migration:**
```sql
-- backend/migrations/20260218_add_appointment_reminder.sql
BEGIN;

-- Add column
ALTER TABLE appointments ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

-- Add index
CREATE INDEX idx_appointments_reminder_sent ON appointments(reminder_sent) WHERE reminder_sent = FALSE;

-- Verify
SELECT COUNT(*) FROM appointments WHERE reminder_sent IS NULL;
-- Expected: 0

COMMIT;
```

❌ Manual schema changes in production are forbidden
❌ Migrations without rollback plan are forbidden
✅ All migrations must be versioned and tracked
✅ Test migrations with realistic data volumes

---

## 30. CRITICAL LESSONS LEARNED & DEBUGGING RULES

### 30.1 Validation Schema Completeness

**MANDATORY: Every frontend form field MUST exist in backend Joi validation schema.**

**Common Issue Pattern:**
- Frontend has `address` field in form
- Backend schema missing `address` field
- Joi validation middleware strips out unknown fields
- Data never reaches database
- Bug appears as "field not saving"

**Prevention:**
```javascript
// ✅ CORRECT: Include ALL fields (even optional ones)
const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  address: Joi.string().max(500).optional(), // Include optional fields!
  
  // Role-based fields with conditional validation
  consultationFee: Joi.number().min(0).when("role", {
    is: "doctor",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});
```

**Verification Steps:**
1. List all fields in Add/Edit forms
2. Check each field exists in validation schema
3. Test creating records with optional fields filled
4. Verify in database that optional fields saved

❌ **Forbidden:** Adding form fields without updating validation schema
✅ **Required:** Update validation schema BEFORE adding form UI

---

### 30.2 Form Field Consistency (Add vs Edit)

**MANDATORY: Add and Edit forms must have identical field sets.**

**Common Issue Pattern:**
- Add Doctor form missing `consultationFee` field
- Edit Doctor form has `consultationFee` field
- Users confused why they can't set during creation
- Inconsistent user experience

**Solution:**
```javascript
// Define shared field configuration
const DOCTOR_FORM_FIELDS = [
  'name', 'email', 'specialization', 
  'qualification', 'experience', 
  'consultationFee', 'department'
];

// Use in both AddDoctorModal and EditDoctorModal
```

❌ **Forbidden:** Different fields in Add vs Edit
✅ **Required:** Identical field sets, test both workflows

---

### 30.3 Dashboard Cache Invalidation

**MANDATORY: ALL operations affecting stats/counts MUST invalidate dashboard cache.**

**Common Issue Pattern:**
- Deactivate doctor → `isActive` updated in database
- Dashboard still shows old "active doctors" count
- User confused, think change didn't work
- Cache expires after 30+ seconds, then shows correct data

**Solution:**
```javascript
// In EVERY user CRUD operation
exports.updateUserStatus = async (req, res) => {
  await userRepository.update(userId, { isActive: false });
  
  // ✅ MUST invalidate dashboard cache
  const { deleteCacheByPattern } = require("../config/redis");
  await deleteCacheByPattern("v1:cache:dashboard:*");
  await deleteCacheByPattern("v1:cache:doctors:*");
};
```

**Operations Requiring Dashboard Invalidation:**
- `createUser` - Affects total counts
- `updateUserStatus` - Affects active/inactive counts
- `deleteUser` - Affects total counts
- `createAppointment` - Affects appointment counts
- `cancelAppointment` - Affects pending counts

❌ **Forbidden:** User CRUD without dashboard cache invalidation
✅ **Required:** Always include `v1:cache:dashboard:*` pattern

---

### 30.4 React Native Metro Bundler Cache

**MANDATORY: Reload React Native app after EVERY code change.**

**Common Issue Pattern:**
- Edit frontend code, save files
- Test immediately without reload
- Bug still occurs, assume fix didn't work
- Actually Metro bundler using cached JavaScript bundle

**Solution:**
```bash
# After ANY frontend code change:
# Press 'r' in Metro bundler terminal

# If behavior still wrong:
npx expo start --clear

# For stubborn cache issues:
watchman watch-del-all
rm -rf node_modules/.cache
npx expo start --clear
```

**When to ALWAYS Reload:**
- Adding new form fields
- Changing validation logic
- Updating API calls
- Modifying state management
- Any JavaScript/JSX changes

❌ **Forbidden:** Testing without reloading app
✅ **Required:** Press 'r' after every edit

---

### 30.5 Systematic Bug Investigation Workflow

**Follow this order when debugging:**

```
1. REPRODUCE
   ✅ Exact steps to reproduce
   ✅ Test on fresh data
   ✅ Verify across app restarts
   
2. ISOLATE LAYER
   Frontend → UI/Component issue
   Backend → API/Logic issue
   Database → Schema/Query issue
   
3. CHECK LOGS
   Frontend: console.log statements
   Backend: combined.log (tail -f)
   Database: Query results
   
4. VERIFY CHANGES
   ✅ Code changes saved
   ✅ Backend server restarted
   ✅ Frontend app reloaded
   ✅ Cache cleared (if needed)
   
5. TEST THOROUGHLY
   ✅ Create new record
   ✅ Verify in database
   ✅ Check backend logs
   ✅ Navigate away and back
   ✅ Test on fresh app launch
```

**Common Bug Patterns:**
- **Field not saving** → Check validation schema completeness
- **UI shows stale data** → Check cache invalidation + reload app
- **Form field missing** → Compare Add vs Edit forms
- **Changes don't apply** → Reload Metro bundler

❌ **Forbidden:** Assuming fix works without full verification
✅ **Required:** Follow complete debugging checklist

---

### 30.6 Production Debugging Checklist

**Before marking ANY bug as "fixed":**

- [ ] Code changes verified in actual files
- [ ] Backend server restarted with new code
- [ ] Frontend app reloaded (Metro cache cleared)
- [ ] Test data created successfully
- [ ] Database verified with SQL query
- [ ] Backend logs show correct data flow
- [ ] Cache invalidation confirmed in logs
- [ ] Navigation flow tested (forward/back)
- [ ] No error messages in console
- [ ] Final test on completely fresh app launch
- [ ] Tested with multiple test cases
- [ ] Edge cases considered and tested

**Incomplete testing = Bug still exists**

---

## 31. ABSOLUTE FINAL RULE

> **If implementing these architecture patterns does not make the system more maintainable, scalable, and secure, it violates AayuCare's engineering standards.**

All rules in this document are MANDATORY for production healthcare application.

Violation = CRITICAL DEFECT requiring immediate fix.

**Critical Lessons Integration:**
- Validation schemas must be complete (Section 30.1)
- Form fields must be consistent (Section 30.2)
- Cache invalidation must be comprehensive (Section 30.3)
- Metro bundler cache must be cleared (Section 30.4)
- Debugging must be systematic (Section 30.5)
- Testing must be thorough (Section 30.6)

Donot create every time *.md file and unused file and code remove and bug fix after testing code also remove 

critical and non-critical all issues fix it all till then after stop

- You Always better formatein your codebase, focusing on security, performance, code quality, and best practices.

**For detailed debugging workflows and architecture patterns, see:**
- `/docs/ARCHITECTURE_RULES.md` - Complete architecture guidelines
- Section 17.4 - Validation Schema Completeness
- Section 17.5 - Form Field Parity
- Section 16.4 - Dashboard Cache Invalidation
- Section 5.1 - React Native Metro Bundler Cache
- Section 27 - Debugging Workflow (Systematic Approach)    