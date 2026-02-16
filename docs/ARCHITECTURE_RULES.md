# 🏥 AayuCare - Production Architecture Rules

Version: 1.0
Environment: Production-Ready
Database Strategy: Hybrid (SQL + NoSQL)

---

# 1️⃣ SYSTEM ARCHITECTURE PRINCIPLES

## 1.1 Layered Architecture (Mandatory)

All backend code must follow:

Controller → Service → Repository → Database

- Controllers: Handle request/response only.
- Services: Business logic only.
- Repositories: Database interaction only.
- No direct DB calls inside controllers.

---

# 2️⃣ DATABASE STRATEGY (Hybrid Model)

## 2.1 SQL Database (Structured Data)

Used for:
- Users
- Roles
- Appointments
- Billing
- Transactions
- Reports metadata

Rules:
- Use normalized schema.
- Use foreign keys.
- Use transactions for financial operations.
- Use migrations for schema updates.
- Never modify schema manually in production.

---

## 2.2 NoSQL Database (Flexible Data)

Used for:
- Health metrics
- Logs
- Audit trails
- Medical readings
- AI-generated insights

Rules:
- Validate ObjectId before query.
- Index frequently queried fields.
- Avoid deeply nested documents.
- Keep document size under MongoDB limits.

---

# 3️⃣ AUTHENTICATION & AUTHORIZATION

## 3.1 Authentication

- JWT-based authentication.
- Access token expiry: short-lived.
- Refresh token rotation enabled.
- Store tokens securely (SecureStore in mobile).

## 3.2 Role-Based Access Control (RBAC)

Roles:
- patient
- doctor
- admin

Rules:
- Patient → Access only own data.
- Doctor → Access assigned patients only.
- Admin → Controlled full access.

Never trust frontend role value.

Always validate on backend.

---

# 4️⃣ API DESIGN RULES

- RESTful naming conventions.
- No business logic inside routes.
- All inputs validated (Joi/Zod).
- Centralized error handling middleware.
- Proper HTTP status codes.
- No hardcoded IDs or test data in production.

---

# 5️⃣ FRONTEND ARCHITECTURE (React Native - Expo)

Folder structure:

src/
 ├── screens/
 ├── components/
 ├── api/
 ├── hooks/
 ├── context/
 ├── navigation/
 ├── theme/
 └── utils/

Rules:
- Centralized API client.
- No API calls directly inside UI components.
- Use global error handler.
- All colors must come from theme file.
- No inline hardcoded colors.

---

# 6️⃣ SECURITY RULES (Healthcare Grade)

- Validate ObjectId before DB queries.
- Sanitize all inputs.
- Use Helmet middleware.
- Enable rate limiting.
- Log security events.
- Never expose stack traces in production.
- Store secrets in environment variables only.

---

# 7️⃣ ENVIRONMENT CONFIGURATION

Use separate environments:
- development
- staging
- production

Rules:
- Never commit .env files.
- Use environment validation on server start.
- Separate DB connections per environment.

---

# 8️⃣ LOGGING & MONITORING

- Structured logging (JSON format).
- Error logs must include:
  - timestamp
  - service name
  - stack trace
- Monitor API latency.
- Monitor DB performance.

---

# 9️⃣ PRODUCTION BUILD RULES

Mobile:
- Use EAS build.
- No localhost URLs.
- Production API base URL only.
- Remove console.log before release.

Backend:
- Use process manager (PM2 if self-hosted).
- Enable compression.
- Enable CORS properly.

---

# 🔟 SCALABILITY STRATEGY

10k Users:
- Add Redis caching.

50k Users:
- Separate microservices.
- Background job queue.

100k+ Users:
- Load balancer.
- Horizontal scaling.

---

# 1️⃣1️⃣ CODE QUALITY RULES

- No duplicate logic.
- No direct DB calls in controllers.
- No hardcoded values.
- Use TypeScript if possible.
- Follow ESLint + Prettier rules.
- All critical services must have unit tests.

---

# 1️⃣2️⃣ AI INTEGRATION PREPARATION

Future ML comparison module must:

- Run as separate service.
- Not block main API thread.
- Store results in NoSQL.
- Keep patient data encrypted at rest.

# 13 documention

    -must follow online documention for formate, package for frontend, backend, database

---

# 🚫 STRICTLY FORBIDDEN

- Hardcoded user IDs.
- Using role string as ObjectId.
- Storing passwords in plain text.
- Using localhost in production.
- Skipping validation.
- Direct DB query from frontend.
- Direct Mongoose model usage in controllers.
- Unvalidated API routes.
- Uncached GET endpoints.
- Missing cache invalidation.
- SQL string concatenation.
- Unbounded database queries.

---

# 1️⃣4️⃣ REPOSITORY PATTERN (IMPLEMENTATION DETAILS)

## 14.1 Repository Structure

ALL database access MUST use repositories:

```
Controllers → Services → Repositories → Database
```

**Repository Responsibilities:**
- Pure data access only
- No business logic
- Return consistent data types
- Handle database-specific operations
- Use parameterized queries (SQL injection prevention)

**Forbidden in Repositories:**
- Business rule validation
- API calls
- File system operations
- Direct HTTP responses

## 14.2 Repository Method Naming

Standard CRUD operations:
```javascript
// ✅ CORRECT
findById(id)
findByEmail(email)
findAll(filters)
create(data)
update(id, updates)
delete(id)

// ❌ FORBIDDEN
get(id)
save(data)
remove(id)
```

## 14.3 Repository Response Format

Repositories MUST return:
- Plain objects (no database-specific types)
- null for not found (not throwing errors)
- Arrays for multiple results
- Boolean for success/failure operations

**Example:**
```javascript
// User Repository
async findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}
```

---

# 1️⃣5️⃣ TRANSACTION PATTERN (ACID COMPLIANCE)

## 15.1 When to Use Transactions

Transactions are MANDATORY for:
- Appointment + Payment creation
- User + Profile creation (doctor/patient)
- Appointment cancellation + Refund
- Any operation spanning multiple tables
- Financial operations
- Critical data integrity operations

## 15.2 Transaction Implementation

**Use transaction helper:**
```javascript
const { withTransaction } = require('../utils/transaction');

const result = await withTransaction(async (client) => {
  const user = await client.query('INSERT INTO users...', [data]);
  const profile = await client.query('INSERT INTO doctors...', [userData]);
  return { user, profile };
});
```

**Built-in Transaction Functions:**
- `createAppointmentWithPayment(appointmentData, paymentData)`
- `cancelAppointmentWithRefund(appointmentId, refundData)`
- `completeAppointmentWithPayment(appointmentId, paymentData)`
- `createUserWithProfile(userData, profileData, role)`

## 15.3 Transaction Rules

❌ **Forbidden:**
- Manual COMMIT/ROLLBACK
- Nested transactions without savepoints
- Long-running transactions (> 5 seconds)
- Transactions in loops

✅ **Required:**
- Automatic rollback on error
- Connection return to pool
- Timeout limits
- Error logging

---

# 1️⃣6️⃣ CACHING STRATEGY (PERFORMANCE)

## 16.1 Cache TTL Rules

**Mandatory caching for all GET routes:**

- **Public data**: 300s (5 min) - Events, Doctor lists
- **User data**: 120s (2 min) - Profiles, Medical records
- **Dynamic data**: 30-60s - Appointments, Search results
- **Real-time data**: 10s - Notifications, Unread counts
- **Critical data**: 10s - System health, Metrics

## 16.2 Cache Implementation

**Middleware usage:**
```javascript
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');

// GET - Cache results
router.get('/doctors', cacheMiddleware(300), getDoctors);

// POST - Invalidate cache
router.post('/doctors', createDoctor, invalidateCache('cache:doctors:*'));
```

**Specialized Cache Middleware:**
- `cacheDoctorList` - 300s TTL
- `cacheDoctorAvailability` - 60s TTL
- `cachePatientAppointments` - 30s TTL
- `cacheDashboard` - 60s TTL

## 16.3 Cache Invalidation Rules

ALL write operations MUST invalidate related caches:

| Operation | Invalidate Pattern |
|-----------|-------------------|
| Create/Update Doctor | `cache:doctors:*` |
| Create/Update Appointment | `cache:appointments:*` |
| Update Patient Profile | `cache:patient:*` |
| User operations | `cache:user:*` |
| Prescription changes | `cache:prescription:*` |

❌ **Forbidden:**
- GET routes without caching
- Write operations without invalidation
- Infinite cache TTL
- Caching sensitive data without encryption

---

# 1️⃣7️⃣ VALIDATION FLOW (ZERO TOLERANCE)

## 17.1 Input Validation Requirements

ALL API routes MUST validate:
- Request body structure
- Field data types
- Field lengths/ranges
- Email/Phone formats
- UUID/ObjectId formats
- Enum values

## 17.2 Validation Schemas

Use Joi schemas from `src/validators/schemas.js`:

```javascript
const { validateBody } = require('../middleware/validation');
const { createAppointmentSchema } = require('../validators/schemas');

router.post(
  '/appointments',
  validateBody(createAppointmentSchema),
  createAppointment
);
```

**Available schemas:**
- `registerSchema` - User registration
- `loginSchema` - Authentication
- `createAppointmentSchema` - Appointments
- `updateAppointmentSchema` - Appointment updates
- `createPaymentSchema` - Payments
- `createPrescriptionSchema` - Prescriptions
- `createMedicalRecordSchema` - Medical records
- `updateProfileSchema` - Profile updates

## 17.3 Validation Error Handling

Validation errors MUST return:
- HTTP 400 status
- Clear error message
- Field-specific errors
- No stack traces

**Example response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "phone": "Phone number must be 10 digits"
  }
}
```

---

# 1️⃣8️⃣ SECURITY IMPLEMENTATION (HEALTHCARE GRADE)

## 18.1 SQL Injection Prevention (ZERO TOLERANCE)

ALL PostgreSQL queries MUST use parameterized statements:

```javascript
// ✅ CORRECT - Parameterized query
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ FORBIDDEN - String concatenation
const result = await query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

**Violation = CRITICAL SECURITY BREACH**

## 18.2 Input Sanitization

ALL user inputs MUST be sanitized:

**Email:**
```javascript
email.trim().toLowerCase()
```

**Phone:**
```javascript
phone.replace(/\D/g, '') // Extract digits only
```

**Search queries:**
```javascript
searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex
```

**MongoDB ObjectId:**
```javascript
if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
  throw new Error('Invalid ObjectId format');
}
```

## 18.3 Rate Limiting Implementation

**Required limits:**
- General APIs: 100 requests / 15 min
- Auth endpoints: 5 attempts / 15 min
- Search endpoints: 30 requests / min
- File uploads: 10 requests / hour

**Implementation:**
```javascript
// Redis-based rate limiting
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

## 18.4 Session Security

**Session storage rules:**
- Store in Redis (NOT in-memory)
- 7-day expiry maximum
- Token rotation on sensitive operations
- Blacklist support for logout
- Revocation on password change

**Session data structure:**
```javascript
{
  userId: 'uuid',
  email: 'user@example.com',
  role: 'patient',
  hospitalId: 'MAIN',
  createdAt: timestamp,
  expiresAt: timestamp
}
```

---

# 1️⃣9️⃣ DATABASE OPTIMIZATION (PERFORMANCE)

## 19.1 Connection Pooling

**PostgreSQL:**
```javascript
max: 20,  // Maximum connections
min: 5,   // Minimum idle connections
idleTimeoutMillis: 30000,
connectionTimeoutMillis: 2000
```

**MongoDB:**
```javascript
maxPoolSize: 10,
minPoolSize: 5,
serverSelectionTimeoutMS: 5000
```

**Redis:**
```javascript
maxRetriesPerRequest: 3,
retryDelayOnFailover: 100
```

## 19.2 Query Optimization

**Required optimizations:**
- Index on all foreign keys
- Index on frequently queried columns
- Compound indexes for multi-column queries
- LIMIT/OFFSET for pagination
- SELECT specific fields (not SELECT *)

**Forbidden:**
- Queries without WHERE clause on large tables
- N+1 query problems
- Unindexed JOIN operations
- Full table scans in production

## 19.3 Index Strategy

**Required indexes:**
```sql
-- Foreign keys
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);

-- Search columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- Date ranges
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Compound indexes
CREATE INDEX idx_appointments_doctor_date 
  ON appointments(doctor_id, appointment_date);
```

---

# 2️⃣0️⃣ MONITORING & AUDIT TRAIL

## 20.1 Structured Logging

ALL logs MUST be JSON formatted:

```javascript
logger.info('User login', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.get('user-agent'),
  timestamp: new Date().toISOString()
});
```

**Log levels:**
- `error`: System failures, unhandled exceptions
- `warn`: Recoverable issues, deprecated usage
- `info`: Important business events
- `debug`: Development debugging (excluded in production)

**Forbidden in logs:**
- Passwords (plain or hashed)
- Tokens (JWT, API keys)
- Credit card numbers
- Full medical records
- Personal identification numbers

## 20.2 Audit Trail Requirements

**audit_logs table MUST record:**
- User registration/login/logout
- Profile updates
- Appointment creation/modification/cancellation
- Medical record access
- Payment transactions
- Admin actions
- Role changes

**Audit log structure:**
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

## 20.3 Error Tracking

ALL errors MUST include:
- Stack trace
- Request context
- User context
- Timestamp
- Environment
- Error code

**Example:**
```javascript
logger.error('Appointment creation failed', {
  error: error.message,
  stack: error.stack,
  userId: req.user?.id,
  requestBody: sanitize(req.body),
  route: req.originalUrl,
  method: req.method
});
```

---

# 2️⃣1️⃣ SCALABILITY (10k+ CONCURRENT USERS)

## 21.1 Load Requirements

Application MUST handle:
- 10k+ concurrent active users
- 1000 requests per minute
- 50 concurrent database connections
- 100MB Redis memory usage
- < 200ms average response time

## 21.2 Pagination Requirements

ALL list endpoints MUST support pagination:

**Query parameters:**
```javascript
?page=1&limit=20&sortBy=createdAt&sortOrder=DESC
```

**Response format:**
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 200,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Limits:**
- Default limit: 20 items
- Maximum limit: 100 items
- Minimum limit: 1 item

## 21.3 Response Size Limits

**Maximum sizes:**
- Single record response: 100KB
- List response: 1MB
- File upload: 10MB
- JSON payload: 1MB

Exceeding limits MUST return 413 (Payload Too Large)

---

# 2️⃣2️⃣ DEPLOYMENT & PRODUCTION

## 22.1 Health Check

`/health` endpoint MUST return:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-17T10:30:00Z",
  "version": "2.0.0",
  "services": {
    "postgres": { "status": "connected", "latency": "5ms" },
    "mongodb": { "status": "connected", "latency": "12ms" },
    "redis": { "status": "connected", "latency": "2ms" }
  },
  "uptime": 86400
}
```

## 22.2 Graceful Shutdown

Server MUST handle SIGTERM/SIGINT:

```javascript
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  await mongoose.connection.close();
  await closePool(); // PostgreSQL
  await closeRedis();
  
  // Stop accepting new requests
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
```

## 22.3 Environment Validation

Server MUST validate environment variables on startup:

**Required variables:**
```javascript
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'POSTGRES_HOST',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'REDIS_HOST',
  'JWT_SECRET'
];
```

Missing variables MUST prevent server startup.

---

# 2️⃣3️⃣ CODE QUALITY STANDARDS

## 23.1 Controller Standards

Controllers MUST:
- Be thin (orchestration only)
- Use services for business logic
- Return consistent response format
- Handle errors via middleware
- Not contain database queries

**Response format:**
```javascript
{
  status: 'success' | 'error',
  message: string,
  data: object | array | null
}
```

## 23.2 Service Layer Standards

Services MUST:
- Use repositories for data access
- Implement business logic
- Use transactions for atomic operations
- Validate business rules
- Not handle HTTP requests/responses

## 23.3 Repository Standards

Repositories MUST:
- Return consistent data types
- Use parameterized queries
- Handle database-specific logic
- Not implement business logic
- Include JSDoc comments

**Example:**
```javascript
/**
 * Find user by email address
 * @param {string} email - User email
 * @param {boolean} includePassword - Include password_hash in result
 * @returns {Promise<Object|null>} - User object or null if not found
 */
async findByEmail(email, includePassword = false) {
  const fields = includePassword 
    ? '*' 
    : 'id, email, name, role, created_at';
  
  const result = await query(
    `SELECT ${fields} FROM users WHERE email = $1`,
    [email]
  );
  
  return result.rows[0] || null;
}
```

---

# 2️⃣4️⃣ PRE-DEPLOYMENT CHECKLIST

Before ANY production deployment:

✅ All tests passing
✅ No console.log statements
✅ All environment variables configured
✅ Database migrations executed
✅ Health check endpoint responding
✅ Error tracking configured
✅ Log rotation enabled
✅ Rate limiting active
✅ Caching working (Redis connected)
✅ All validation schemas in place
✅ Security headers configured
✅ CORS properly configured
✅ No hardcoded credentials
✅ Audit logging enabled
✅ Backup strategy in place

**If ANY check fails → deployment is BLOCKED**

---

# ✅ FINAL GOAL

AayuCare must be:

- Secure
- Scalable
- Cleanly structured
- Production-grade
- AI-ready
- Healthcare-compliant
- Performance optimized
- Properly monitored
- ACID compliant
- Cache optimized

**All architecture patterns implemented = Production Ready ✅**
