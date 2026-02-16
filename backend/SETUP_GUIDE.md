# AayuCare - Hybrid Architecture Setup Guide

## 🏗️ Architecture Overview

AayuCare now uses a **production-grade hybrid database architecture**:

### Database Separation

#### **PostgreSQL** (Primary Relational Database)

- Users, Doctors, Patients
- Appointments, Payments, Prescriptions
- Schedules, Audit Logs
- **Why**: ACID transactions, referential integrity, complex queries

#### **MongoDB Atlas** (Document Database)

- Medical Records (dynamic schemas)
- Doctor Notes, AI Analysis
- Activity Logs, Events
- Chat History, Notifications
- **Why**: Flexible schemas, nested documents, scalability

#### **Redis** (Caching + Session + Performance)

- JWT session storage
- OTP verification
- Doctor availability cache
- Rate limiting counters
- Token blacklist
- **Why**: Sub-millisecond latency, session management

---

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)

   ```bash
   node --version
   ```

2. **PostgreSQL** (v14 or higher)

   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

3. **Redis** (Latest stable)

   - Windows: Download from https://github.com/tporadowski/redis/releases
   - Linux/Mac: `brew install redis` or `apt install redis`
   - Verify: `redis-cli ping` (should return `PONG`)

4. **MongoDB Atlas** (Already configured)
   - Existing connection string in `.env`

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This installs:

- `pg` - PostgreSQL client
- `ioredis` - Redis client
- `joi` - Validation library
- All existing dependencies

### Step 2: Configure PostgreSQL

#### Create Database and User

```bash
# Open PostgreSQL CLI
psql -U postgres

# Inside psql:
CREATE DATABASE aayucare_db;
CREATE USER aayucare_admin WITH ENCRYPTED PASSWORD 'aayucare_secure_password_2026';
GRANT ALL PRIVILEGES ON DATABASE aayucare_db TO aayucare_admin;
\q
```

#### Verify Connection

```bash
psql -U aayucare_admin -d aayucare_db -h localhost
```

If successful, you'll see:

```
aayucare_db=>
```

### Step 3: Configure Redis

#### Start Redis Server

**Windows:**

```bash
redis-server
```

**Linux/Mac:**

```bash
redis-server
# OR (if installed via system package)
sudo systemctl start redis
```

#### Verify Redis

```bash
redis-cli ping
# Output: PONG
```

### Step 4: Initialize PostgreSQL Schema

```bash
npm run init:postgres
```

This creates all tables, indexes, constraints, and triggers.

Expected output:

```
✅ Connecting to PostgreSQL...
✅ Reading schema file...
✅ Executing schema...
✅ PostgreSQL schema initialized successfully
Created tables:
  - users
  - doctors
  - patients
  - appointments
  - payments
  - prescriptions
  - schedules
  - audit_logs
```

### Step 5: Verify `.env` Configuration

Ensure your `.env` file has:

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=aayucare_admin
POSTGRES_PASSWORD=aayucare_secure_password_2026
POSTGRES_DB=aayucare_db
POSTGRES_MAX_POOL=20
POSTGRES_MIN_POOL=5

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# MongoDB (Existing)
MONGODB_URI=mongodb://...
```

### Step 6: Start the Server

```bash
npm run dev
```

Expected output:

```
✅ MongoDB Connected: ...
✅ PostgreSQL Connected Successfully
✅ Redis Connected Successfully
✅ Better Auth initialized
🚀 Server running in development mode on port 5000
```

### Step 7: Verify Health Check

```bash
curl http://localhost:5000/api/health
```

Response:

```json
{
  "status": "success",
  "message": "AayuCare Backend Server is running",
  "databases": {
    "mongodb": "connected",
    "postgresql": "connected",
    "redis": "connected"
  }
}
```

---

## 🏗️ Architecture Benefits

### 1. **ACID Transactions**

Critical operations (appointments + payments) are wrapped in PostgreSQL transactions:

```javascript
// Either both succeed or both fail
await createAppointmentWithPayment(appointmentData, paymentData);
```

### 2. **Repository Pattern**

No direct database calls in controllers:

```javascript
// ❌ Before
const user = await User.findById(id);

// ✅ After
const user = await userRepository.findById(id);
```

### 3. **Redis Caching**

Automatic caching for frequently accessed data:

```javascript
// Doctor list cached for 5 minutes
app.get("/api/doctors", cacheDoctorList, getDoctors);
```

### 4. **Validation Layer**

All requests validated before processing:

```javascript
router.post(
  "/appointments",
  validateBody(createAppointmentSchema),
  createAppointment
);
```

### 5. **Graceful Degradation**

App continues working even if Redis fails (caching disabled, no crash)

---

## 📊 Data Flow Examples

### Creating an Appointment

1. **Request** → Validation Middleware
2. **Validation** → Controller
3. **Controller** → Service Layer
4. **Service** → Repository Layer (PostgreSQL transaction)
5. **Repository** → Insert appointment + payment atomically
6. **Cache** → Invalidate affected caches
7. **Response** → Structured JSON to client

### User Login

1. **Validation** → Email/password format
2. **Repository** → Fetch user from PostgreSQL
3. **Auth** → Verify bcrypt hash
4. **Redis** → Store JWT session (7 days TTL)
5. **Response** → JWT token + user data

---

## 🔍 Monitoring & Debugging

### Check Database Connections

```bash
curl http://localhost:5000/api/health
```

### View PostgreSQL Tables

```bash
psql -U aayucare_admin -d aayucare_db

# Inside psql:
\dt                          # List all tables
SELECT * FROM users LIMIT 5; # View users
\d appointments              # Show table structure
```

### Check Redis Cache

```bash
redis-cli

# Inside redis-cli:
KEYS *                    # List all keys
GET cache:doctors:all     # View cached data
DBSIZE                    # Number of keys
FLUSHDB                   # Clear cache (use with caution)
```

### View Application Logs

Logs are stored in `backend/logs/` directory:

- `error.log` - Error logs
- `combined.log` - All logs

---

## 🛠️ Common Issues & Solutions

### Issue 1: PostgreSQL Connection Failed

**Error**: `ECONNREFUSED` or `password authentication failed`

**Solution**:

1. Verify PostgreSQL is running:

   ```bash
   sudo systemctl status postgresql  # Linux
   brew services list                # Mac
   # Check Services app on Windows
   ```

2. Check credentials in `.env`
3. Ensure database exists:
   ```bash
   psql -U postgres -l
   ```

### Issue 2: Redis Connection Failed

**Error**: `ECONNREFUSED` on port 6379

**Solution**:

1. Start Redis:

   ```bash
   redis-server
   ```

2. Check if Redis is running:

   ```bash
   redis-cli ping
   ```

3. If app continues working, Redis is optional (graceful degradation)

### Issue 3: Schema Already Exists

**Error**: `relation "users" already exists`

**Solution**:
This is normal if running `init:postgres` multiple times. Schema is idempotent (uses `IF NOT EXISTS`).

To reset (⚠️ **DELETES ALL DATA**):

```bash
psql -U aayucare_admin -d aayucare_db

# Inside psql:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# Then re-run:
npm run init:postgres
```

---

## 📈 Performance Optimization

### 1. Connection Pooling

PostgreSQL uses connection pooling (20 max connections):

```env
POSTGRES_MAX_POOL=20
POSTGRES_MIN_POOL=5
```

### 2. Redis Caching

Frequently accessed data cached automatically:

- Doctor list: 5 minutes
- Doctor availability: 60 seconds
- Patient appointments: 30 seconds

### 3. Indexes

All critical queries use indexes:

- `users.email` - Login lookups
- `appointments.doctor_id, appointment_date` - Doctor schedules
- `payments.status` - Payment filtering

---

## 🔒 Security Features

### 1. SQL Injection Prevention

All queries use parameterized statements:

```javascript
query("SELECT * FROM users WHERE email = $1", [email]);
```

### 2. Rate Limiting

- General API: 100 requests/15 minutes
- Auth endpoints: 5 attempts/15 minutes

### 3. Token Blacklisting

Revoked tokens stored in Redis:

```javascript
await blacklistToken(token, ttl);
```

### 4. Password Hashing

bcrypt with 10 rounds (already implemented)

---

## 🧪 Testing

### Manual Testing

1. **Health Check**

   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Register User**

   ```bash
   curl -X POST http://localhost:5000/api/user/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Dr. Test",
       "email": "test@example.com",
       "phone": "+911234567890",
       "password": "password123",
       "role": "doctor",
       "hospitalId": "MAIN",
       "specialization": "Cardiology",
       "qualification": "MBBS, MD",
       "experience": 5,
       "consultationFee": 500
     }'
   ```

3. **Login**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

---

## 📦 Deployment Checklist

Before deploying to production:

- [ ] Change default passwords in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure production PostgreSQL connection
- [ ] Configure production Redis connection
- [ ] Enable SSL for PostgreSQL
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Set up monitoring (health checks)
- [ ] Review and update rate limits
- [ ] Enable audit logging

---

## 🆘 Support

For issues or questions:

1. Check application logs in `backend/logs/`
2. Verify all services are running (PostgreSQL, Redis, MongoDB)
3. Review this documentation

---

## 📚 Next Steps

1. ✅ Run `npm run init:postgres` to create schema
2. ✅ Start Redis server
3. ✅ Run `npm run dev` to start the application
4. ✅ Test with `/api/health` endpoint
5. ✅ Begin migrating existing data (if needed)

---

**Last Updated**: February 15, 2026
**Version**: 2.0.0 (Hybrid Architecture)
