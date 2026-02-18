# 🏥 AayuCare - Production Architecture Rules

Version: 2.0
Last Updated: February 19, 2026
Environment: Production-Ready
Database Strategy: Hybrid (SQL + NoSQL)

---

## 📋 QUICK REFERENCE - NEW CRITICAL RULES

**Recently Added (Based on Production Issues):**

1. **Section 17.4** - Validation Schema Completeness
   - Every frontend form field MUST exist in backend Joi schema
   - Joi strips unknown fields by default → Data loss

2. **Section 17.5** - Form Field Parity
   - Add and Edit forms MUST have identical fields
   - Don't confuse users with inconsistent interfaces

3. **Section 16.4** - Dashboard Cache Invalidation
   - ALL user CRUD operations MUST invalidate dashboard cache
   - Always include `v1:cache:dashboard:*` pattern

4. **Section 5.1** - React Native Metro Bundler Cache
   - ALWAYS reload app after code changes (press 'r')
   - Use `npx expo start --clear` for stubborn cache issues

5. **Section 27** - Systematic Debugging Workflow
   - Complete bug investigation methodology
   - Common patterns with solutions
   - Production debugging checklist

**Jump to:** [Validation](#1️⃣7️⃣-validation-flow-zero-tolerance) | [Caching](#1️⃣6️⃣-caching-strategy-performance) | [Debugging](#2️⃣7️⃣-debugging-workflow-systematic-approach)

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

## 5.1 React Native Metro Bundler Cache (CRITICAL)

**Rule: After editing frontend code, ALWAYS reload the React Native app to clear cache.**

### Problem:
React Native Metro bundler caches JavaScript bundles. After code changes, the app may still run old cached code even though files were updated on disk.

### Symptoms:
- Bug still occurs after code fix
- New form fields don't appear
- Old validation logic still runs
- Backend logs show correct data, but frontend behaves incorrectly

### Solution:

**Method 1: Reload in Running App**
```bash
# In Metro bundler terminal, press:
r   # Reload JavaScript bundle

# Or on device/simulator:
# Shake device → Tap "Reload"
# iOS Simulator: Cmd + D → Reload
# Android Emulator: Cmd/Ctrl + M → Reload
```

**Method 2: Clear Cache and Restart**
```bash
# Stop Metro bundler (Ctrl + C)
# Clear cache and restart
npx expo start --clear

# Or if using React Native CLI
npm start -- --reset-cache
```

**Method 3: Full Cache Clear**
```bash
# Delete all cache folders
rm -rf node_modules/.cache
rm -rf .expo
watchman watch-del-all  # If using watchman

# Reinstall and restart
npm install
npx expo start --clear
```

### When to Reload:

**Always reload after:**
- ✅ Adding new form fields
- ✅ Changing validation logic
- ✅ Updating API calls
- ✅ Modifying state management
- ✅ Changing conditional rendering
- ✅ Updating imports/exports

**Testing Workflow:**
1. Edit frontend code
2. Save files
3. **Reload app** (press 'r' in Metro)
4. Test the changes
5. If bug persists, check backend logs
6. If logs show correct data but UI wrong → **Clear cache and restart**

### Debugging Cache Issues:

```bash
# 1. Check if Metro is using cached bundle
# Metro logs will show "Fast refresh enabled" on hot reload
# If code changes don't reflect → Cache issue

# 2. Clear Metro cache
npx expo start --clear

# 3. Verify code changes in running app
console.log('[DEBUG] Component loaded at:', new Date().toISOString());
```

❌ **Forbidden:**
- Assuming hot reload automatically clears cache
- Testing immediately after code change without reload
- Concluding "fix didn't work" without clearing cache
- Debugging backend when frontend cache is the issue

✅ **Required:**
- Reload app after every code change
- Clear cache if behavior seems inconsistent
- Test on fresh app launch for final verification
- Document reload instructions for other developers

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

---

# 1️⃣3️⃣ DOCUMENTATION STANDARDS

## 13.1 Documentation Location

ALL documentation files MUST be stored in the `/docs/` directory:

```
docs/
├── ARCHITECTURE_RULES.md
├── PROJECT_RULES.md
├── API_DOCUMENTATION.md
├── DEPLOYMENT_GUIDE.md
└── [feature-specific].md
```

**Required for all .md files:**
- ✅ Root-level guides: `/docs/*.md`
- ✅ Backend documentation: `/docs/backend/*.md`
- ✅ Frontend documentation: `/docs/frontend/*.md`
- ✅ Database schemas: `/docs/database/*.md`

**Exceptions (allowed outside /docs/):**
- `README.md` (root only)
- `CHANGELOG.md` (root only)
- `LICENSE.md` (root only)

## 13.2 Documentation Structure

Each documentation file MUST include:

**Header section:**
```markdown
# [Title]

Version: X.X
Last Updated: [Date]
Environment: [Development/Production]
```

**Required sections:**
- Overview/Purpose
- Prerequisites
- Implementation details
- Examples
- Related documentation links

## 13.3 Documentation Standards

**Format requirements:**
- Use proper markdown syntax
- Follow official documentation for packages/frameworks
- Include code examples
- Add table of contents for long documents (> 200 lines)
- Use consistent heading levels

## 13.4 Code Documentation

**Inline comments:**
- Use JSDoc format for functions
- Comment complex business logic
- Explain "why" not "what"
- Keep comments up-to-date

**API documentation:**
- Document all endpoints
- Include request/response examples
- List all parameters and types
- Specify authentication requirements
- Document error responses

**Database documentation:**
- Schema diagrams
- Table relationships
- Index strategy
- Migration history

## 13.5 Documentation Maintenance

**Required updates:**
- When adding new features → Update relevant .md files
- When changing APIs → Update API documentation
- When modifying database → Update schema docs
- When deploying → Update deployment guides

**Forbidden:**
- Outdated documentation
- Incorrect examples
- Broken internal links
- Placeholder content in production
- Undocumented breaking changes

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

## 16.4 Dashboard Stats Cache Invalidation (CRITICAL)

**Rule: ALL operations affecting stats/counts MUST invalidate dashboard cache.**

### Problem Example:
```javascript
// Deactivate doctor - updates is_active field
exports.updateUserStatus = async (req, res) => {
  await userRepository.update(userId, { isActive: false });
  
  // ❌ Forgot to invalidate dashboard cache
  // Dashboard still shows old "active doctors" count for 30+ seconds
};
```

**Result:** Admin dashboard shows stale data until cache expires naturally.

### Solution:
```javascript
exports.updateUserStatus = async (req, res) => {
  await userRepository.update(userId, { isActive: false });
  
  // ✅ Invalidate dashboard cache
  await deleteCacheByPattern("v1:cache:dashboard:*");
  await deleteCacheByPattern("v1:cache:doctors:*");
};
```

### Complete Invalidation Matrix:

| Controller Method | Must Invalidate |
|------------------|----------------|
| `createUser` | `dashboard:*`, `doctors:*` or `patients:*` |
| `updateUserStatus` | `dashboard:*`, `doctors:*`, `user:*` |
| `deleteUser` | `dashboard:*`, `doctors:*` or `patients:*` |
| `createAppointment` | `dashboard:*`, `appointments:*` |
| `updateAppointment` | `dashboard:*`, `appointments:*` |
| `cancelAppointment` | `dashboard:*`, `appointments:*` |
| `createPrescription` | `dashboard:*`, `prescriptions:*` |

### Implementation Pattern:
```javascript
// In adminController.js
try {
  const { deleteCacheByPattern } = require("../config/redis");
  await deleteCacheByPattern("v1:cache:user:*");
  await deleteCacheByPattern("v1:cache:doctors:*");
  await deleteCacheByPattern("v1:cache:dashboard:*"); // ✅ Always include
  logger.debug("Cache invalidated after status update");
} catch (cacheError) {
  logger.warn("Failed to invalidate cache:", cacheError.message);
}
```

### Testing Checklist:
- [ ] Create doctor → Dashboard "Total Doctors" updates instantly
- [ ] Deactivate doctor → "Active" count updates instantly
- [ ] Delete doctor → Total count decreases instantly
- [ ] Create appointment → "Appointments" count updates instantly
- [ ] No stale data visible after navigation

❌ **Forbidden:**
- Forgetting dashboard cache in user CRUD operations
- Partial cache invalidation (only some patterns)
- Assuming frontend will manually refetch

✅ **Required:**
- Always invalidate `dashboard:*` for count-affecting operations
- Test cache invalidation with real navigation flows
- Monitor backend logs for cache invalidation confirmations

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

## 17.4 Validation Schema Completeness (CRITICAL)

**Rule: Every field in your frontend forms MUST exist in the backend Joi validation schema.**

### Problem Example:
```javascript
// Frontend form has address field
const formData = { name, email, address };

// Backend schema MISSING address field
const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required()
  // ❌ address field missing - Joi will STRIP it out!
});
```

**Result:** Field is silently removed by validation middleware, data never reaches database.

### Solution:
```javascript
// Backend schema includes ALL optional fields
const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  address: Joi.string().max(500).optional() // ✅ Now address is allowed
});
```

### Verification Checklist:
- [ ] Compare frontend form fields with backend validation schema
- [ ] Add ALL optional fields to schema (even if optional)
- [ ] Use conditional validation with `.when()` for role-specific fields
- [ ] Test creating records with optional fields filled in
- [ ] Check database to verify optional fields are saved

**Example - Role-based fields:**
```javascript
// Patient-specific fields
address: Joi.string().max(500).when("role", {
  is: "patient",
  then: Joi.optional(),
  otherwise: Joi.forbidden(),
}),

// Doctor-specific fields
consultationFee: Joi.number().min(0).when("role", {
  is: "doctor",
  then: Joi.required(),
  otherwise: Joi.forbidden(),
}),
```

❌ **Forbidden:**
- Adding form fields without updating validation schema
- Assuming Joi will pass through unknown fields (it strips them by default)
- Testing only with required fields

✅ **Required:**
- Update validation schema BEFORE adding form fields
- Test with ALL fields (required + optional)
- Verify data in database after submission

## 17.5 Form Field Parity (Frontend/Backend)

**Rule: Add/Edit forms for the same entity must have identical fields.**

### Problem Example:
```javascript
// AddDoctorModal - Missing consultation fee field
<TextInput name="specialization" />
<TextInput name="qualification" />
// ❌ consultationFee missing

// EditDoctorModal - Has consultation fee field
<TextInput name="specialization" />
<TextInput name="qualification" />
<TextInput name="consultationFee" /> // ✅ Present
```

**Result:** Users confused why they can't set consultation fee during creation but can edit it later.

### Solution:
Both forms must have:
1. Same input fields
2. Same validation rules
3. Same default values
4. Same field labels

### Implementation Pattern:
```javascript
// Shared form fields configuration
const DOCTOR_FORM_FIELDS = {
  name: { required: true, type: 'text' },
  email: { required: true, type: 'email' },
  specialization: { required: true, type: 'picker' },
  consultationFee: { required: false, type: 'number', default: 500 }
};

// Use in both Add and Edit modals
```

❌ **Forbidden:**
- Different fields in Add vs Edit forms
- Missing optional fields in creation forms
- Hardcoded values that should be user-editable

✅ **Required:**
- Identical field sets for Add/Edit
- Allow users to set optional fields during creation
- Test both creation and editing workflows

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

# 2️⃣5️⃣ DATABASE MAINTENANCE & MONITORING

## 25.1 Database Health Checks

**Daily Automated Checks:**
```bash
# Connection pool status
SELECT count(*) as active_connections FROM pg_stat_activity WHERE datname = 'aayucare_db';

# Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size 
FROM pg_tables WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Slow queries
SELECT query, calls, mean_exec_time FROM pg_stat_statements 
WHERE mean_exec_time > 1000 ORDER BY mean_exec_time DESC LIMIT 10;
```

**Weekly Manual Checks:**
```bash
# Verify foreign key constraints
node backend/verify-postgres.js

# Check audit log growth
SELECT COUNT(*), DATE(created_at) FROM audit_logs 
GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 7;

# Identify missing indexes
SELECT schemaname, tablename, attname FROM pg_stats 
WHERE schemaname = 'public' AND n_distinct > 1000 AND correlation < 0.1;
```

## 25.2 Performance Thresholds

**Alert Levels:**

| Metric | GREEN | YELLOW | RED |
|--------|-------|--------|-----|
| Query time | < 200ms | 200-500ms | > 500ms |
| Connection pool | < 10 | 10-15 | > 15 |
| Table size | < 100MB | 100MB-1GB | > 1GB |
| Appointments | < 500k | 500k-1M | > 1M (partition!) |
| Audit logs | < 1M | 1M-5M | > 5M (archive!) |
| Orphaned records | 0 | 0 | > 0 (CRITICAL) |

## 25.3 Maintenance Windows

**Monthly Tasks (1st Sunday, 2 AM - 4 AM):**
```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Update statistics
ANALYZE;

-- Reindex if needed
REINDEX DATABASE aayucare_db;

-- Archive old audit logs (> 2 years)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years';
```

**Quarterly Tasks:**
- Review and remove unused indexes
- Evaluate partition strategy
- Update connection pool settings
- Review slow query log
- Test backup restoration

## 25.4 Scaling Triggers

**Implement changes when:**

**10k Users:**
- ✅ Current: Connection pooling (20 max)
- ✅ Current: Redis caching enabled
- ✅ Current: All indexes in place

**50k Users:**
- 🔄 Increase connection pool to 50
- 🔄 Add read replicas
- 🔄 Implement database partitioning
- 🔄 Separate audit logs to different database

**100k Users:**
- 🔄 Microservices architecture
- 🔄 Sharding strategy
- 🔄 Dedicated analytics database
- 🔄 CDN for static content

---

# 2️⃣6️⃣ CRISIS RECOVERY PROCEDURES

## 26.1 Database Corruption Recovery

**Immediate Actions:**
```bash
# 1. Stop application
pm2 stop all

# 2. Backup current state
pg_dump -U postgres aayucare_db > backup_corrupted_$(date +%Y%m%d_%H%M%S).sql

# 3. Check corruption
psql -U postgres -d aayucare_db -c "SELECT pg_check_integrity();"

# 4. Restore from last good backup
psql -U postgres -d aayucare_db < backup_last_good.sql

# 5. Verify data integrity
node backend/verify-postgres.js

# 6. Restart application
pm2 start all
```

## 26.2 Foreign Key Violation Recovery

**If FK constraints are violated:**
```bash
# 1. Identify orphaned records
SELECT d.id FROM doctors d LEFT JOIN users u ON d.user_id = u.id WHERE u.id IS NULL;

# 2. Fix orphaned records
-- Option A: Delete orphans
DELETE FROM doctors WHERE user_id NOT IN (SELECT id FROM users);

-- Option B: Create placeholder users
INSERT INTO users (id, email, name, role) 
SELECT DISTINCT user_id, 'orphaned@placeholder.com', 'Orphaned User', 'patient' 
FROM doctors WHERE user_id NOT IN (SELECT id FROM users);

# 3. Re-verify
node backend/verify-postgres.js
```

## 26.3 Audit Log Failure Recovery

**If audit logging fails:**
```bash
# 1. Check table exists
psql -U postgres -d aayucare_db -c "\dt audit_logs"

# 2. Recreate if missing
psql -U postgres -d aayucare_db -f backend/create-audit-logs.sql

# 3. Verify permissions
GRANT ALL ON audit_logs TO aayucare_admin;

# 4. Test insertion
INSERT INTO audit_logs (id, action, entity_type) 
VALUES (gen_random_uuid(), 'test', 'test');
```

---

# 2️⃣7️⃣ DEBUGGING WORKFLOW (SYSTEMATIC APPROACH)

## 27.1 Bug Report Analysis

**When a bug is reported, follow this systematic approach:**

### Step 1: Reproduce the Issue
```
✅ Identify exact steps to reproduce
✅ Test on fresh data (not cached/stale data)
✅ Verify same behavior across app restarts
✅ Document expected vs actual behavior
```

### Step 2: Isolate the Layer
```
Frontend Issue:
- UI not rendering correctly
- Form fields missing
- Validation errors showing wrong messages
→ Check: Component code, state management

Backend Issue:
- API returning errors
- Wrong data in response
- Validation failures
→ Check: Backend logs, API responses

Database Issue:
- Data not saving
- Wrong data returned
- Constraint violations
→ Check: Database queries, schema
```

### Step 3: Systematic Investigation

**Frontend Bug Investigation:**
```bash
# 1. Check if code changes are active
console.log('[DEBUG] Component version:', Date.now());

# 2. Reload React Native app
# Press 'r' in Metro bundler

# 3. Check network requests in backend logs
# Look for API call details

# 4. If behavior unchanged → Clear cache
npx expo start --clear
```

**Backend Bug Investigation:**
```bash
# 1. Check backend logs
tail -f backend/logs/combined.log

# 2. Look for request data
# Search for: "request received", field names

# 3. Check validation middleware
# Search logs for: "Validation failed"

# 4. Check database queries
# Look for: "Executed query", "INSERT/UPDATE"

# 5. Clear Redis cache if needed
redis-cli FLUSHDB
```

**Database Bug Investigation:**
```sql
-- 1. Check if data actually saved
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- 2. Check field values
SELECT user_id, name, address FROM users u
JOIN patients p ON u.id = p.user_id
ORDER BY u.created_at DESC LIMIT 5;

-- 3. Check constraints
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'users';
```

## 27.2 Common Bug Patterns

### Pattern 1: Field Not Saving

**Symptom:** Frontend form field filled in, but database shows NULL/empty.

**Diagnostic Flow:**
```
1. Check frontend logs → Is field in form data?
   ✅ Yes → Go to step 2
   ❌ No → Frontend binding issue

2. Check backend logs → Is field in request body?
   ✅ Yes → Go to step 3
   ❌ No → Frontend not sending field (check API call)

3. Check validation middleware → Is field in schema?
   ✅ Yes → Go to step 4
   ❌ No → ADD FIELD TO VALIDATION SCHEMA

4. Check database query → Is field in INSERT?
   ✅ Yes → Database constraint issue
   ❌ No → Backend not including field in query
```

**Fix Checklist:**
- [ ] Add field to Joi validation schema
- [ ] Ensure field is optional/required correctly
- [ ] Check conditional validation (`.when()`)
- [ ] Test with field filled in
- [ ] Verify in database

### Pattern 2: Data Not Updating in UI

**Symptom:** Changes made but UI shows old data.

**Diagnostic Flow:**
```
1. Backend logs show success?
   ✅ Yes → Go to step 2
   ❌ No → Backend error, fix backend first

2. Reload React Native app (press 'r')
   ✅ Updated → Metro cache issue
   ❌ Still old → Go to step 3

3. Check cache invalidation in backend
   → Search for: deleteCacheByPattern
   → Ensure dashboard:* pattern included

4. Clear Redis cache
   redis-cli FLUSHDB

5. Navigate away and back
   → useFocusEffect should refetch
```

**Fix Checklist:**
- [ ] Add cache invalidation to backend method
- [ ] Include `dashboard:*` pattern for count updates
- [ ] Test navigation flow
- [ ] Verify cache cleared in logs

### Pattern 3: Form Field Missing in UI

**Symptom:** Edit form has field but Add form doesn't.

**Diagnostic Flow:**
```
1. Compare Add and Edit modal components
   → Check which fields are rendered

2. Check formData state initialization
   → Ensure field included with default value

3. Check validation logic
   → Ensure field included in validation

4. Check renderInput/renderPicker calls
   → Ensure field is rendered in JSX
```

**Fix Checklist:**
- [ ] Add field to formData state
- [ ] Add field to resetForm function
- [ ] Add field validation rule
- [ ] Add renderInput/renderPicker in JSX
- [ ] Test creation with field filled

## 27.3 Debugging Tools

### Backend Debugging:
```javascript
// Add detailed logging
logger.info('Patient creation request received:', {
  name: req.body.name,
  hasAddress: !!req.body.address,
  addressLength: req.body.address?.length || 0,
  allFields: Object.keys(req.body)
});

// Log validation results
logger.debug('Validation schema fields:', {
  schemaKeys: Object.keys(registerSchema.describe().keys),
  requestKeys: Object.keys(req.body)
});

// Log database query
logger.debug('Executing query:', {
  query: insertQuery,
  values: values,
  fieldCount: values.length
});
```

### Frontend Debugging:
```javascript
// Add component lifecycle logging
useEffect(() => {
  console.log('[AddPatientModal] Mounted with formData:', formData);
  return () => console.log('[AddPatientModal] Unmounted');
}, []);

// Log form submission
const handleSubmit = async () => {
  console.log('[FORM] Submit triggered with data:', {
    ...formData,
    fieldCount: Object.keys(formData).length
  });
  
  const patientData = { /* ... */ };
  console.log('[API] Sending to backend:', {
    ...patientData,
    hasAddress: !!patientData.address
  });
};
```

### Database Debugging:
```sql
-- Enable query logging temporarily
ALTER DATABASE aayucare_db SET log_statement = 'all';

-- Check recent inserts
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- Check validation constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'patients';
```

## 27.4 Production Debugging Checklist

**Before marking bug as fixed:**
- [ ] Code changes verified in files
- [ ] Backend server restarted with changes
- [ ] Frontend app reloaded (cache cleared)
- [ ] Test data created successfully
- [ ] Database verified with SQL query
- [ ] Backend logs show correct data flow
- [ ] Cache invalidation confirmed in logs
- [ ] Navigation flow tested (back and forth)
- [ ] No error messages in console
- [ ] Final verification on fresh app launch

---

# ✅ FINAL GOAL

AayuCare must be:

- **Secure** - SQL injection prevented, audit logs active
- **Scalable** - Connection pooling, caching, partition-ready
- **Cleanly structured** - Repository pattern, separation of concerns
- **Production-grade** - 8 FK constraints, 37 indexes, 0 orphaned records
- **AI-ready** - MongoDB integration, flexible schemas
- **Healthcare-compliant** - HIPAA audit logging, status-based soft delete
- **Performance optimized** - < 200ms queries, indexed foreign keys
- **Properly monitored** - Weekly health checks, performance thresholds
- **ACID compliant** - Transactions for critical operations
- **Cache optimized** - Redis TTL rules, pattern invalidation
- **Validation complete** - All form fields in schemas, no silent data loss
- **UI/UX consistent** - Add/Edit forms have identical fields
- **Real-time updates** - Dashboard stats update instantly
- **Cache-aware** - Frontend reloads after code changes

**Database Structure Verified:**
- ✅ 8 foreign key constraints (CASCADE/RESTRICT/SET NULL)
- ✅ audit_logs table with 5 indexes
- ✅ 37 performance indexes across all tables
- ✅ Status-based soft delete (appointments/payments)
- ✅ 0 orphaned records
- ✅ 0 duplicate constraints

**Validation & Form Integrity:**
- ✅ All form fields exist in Joi validation schemas
- ✅ Add and Edit forms have identical field sets
- ✅ Optional fields properly marked as `.optional()`
- ✅ Role-based conditional validation with `.when()`

**Cache Management:**
- ✅ Dashboard cache invalidated on all count-affecting operations
- ✅ Redis patterns cover all entity types
- ✅ Frontend Metro bundler cache cleared after edits
- ✅ Cache invalidation confirmed in backend logs

**Debugging Practices:**
- ✅ Systematic bug investigation workflow documented
- ✅ Common bug patterns identified with solutions
- ✅ Logging standards for frontend and backend
- ✅ Production debugging checklist available

**All architecture patterns implemented = Production Ready ✅**

**Verification Commands:**
```bash
# Database integrity
node backend/verify-postgres.js && echo "✅ Database is Production Ready"

# Validation schema completeness
# Check that all form fields exist in schemas

# Cache functionality
redis-cli PING && echo "✅ Redis is operational"

# Frontend Metro cache
npx expo start --clear && echo "✅ Metro cache cleared"
```
