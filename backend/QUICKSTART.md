# 🚀 AayuCare - Quick Start Guide

## Step-by-Step Setup (15 minutes)

### 1️⃣ Install PostgreSQL (3 minutes)

**Windows:**

1. Download: https://www.postgresql.org/download/windows/
2. Run installer, set password: `postgres`
3. Keep default port: `5432`

**Mac:**

```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2️⃣ Install Redis (2 minutes)

**Windows:**

1. Download: https://github.com/tporadowski/redis/releases
2. Extract and run `redis-server.exe`

**Mac:**

```bash
brew install redis
brew services start redis
```

**Linux:**

```bash
sudo apt install redis-server
sudo systemctl start redis
```

### 3️⃣ Create PostgreSQL Database (2 minutes)

```bash
# Open PostgreSQL CLI
psql -U postgres

# In psql, run these commands:
CREATE DATABASE aayucare_db;
CREATE USER aayucare_admin WITH ENCRYPTED PASSWORD 'aayucare_secure_password_2026';
GRANT ALL PRIVILEGES ON DATABASE aayucare_db TO aayucare_admin;
\q
```

### 4️⃣ Install Dependencies (2 minutes)

```bash
cd d:\AayuCare\backend
npm install
```

This installs all dependencies including:

- ✅ `pg` - PostgreSQL client
- ✅ `ioredis` - Redis client
- ✅ `joi` - Validation library

### 5️⃣ Initialize PostgreSQL Schema (1 minute)

```bash
npm run init:postgres
```

Expected output:

```
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

### 6️⃣ Verify Setup (1 minute)

**Check PostgreSQL:**

```bash
psql -U aayucare_admin -d aayucare_db
# Should connect successfully
\dt  # List tables
\q   # Exit
```

**Check Redis:**

```bash
redis-cli ping
# Should return: PONG
```

### 7️⃣ Start the Server (1 minute)

```bash
npm run dev
```

**Successful startup looks like:**

```
✅ MongoDB Connected: ac-usxuq2q-shard-00-00.mrgnbvk.mongodb.net
✅ PostgreSQL Connected Successfully
📊 Database: aayucare_db
✅ Redis Connected Successfully
✅ Better Auth initialized
🚀 Server running in development mode on port 5000
```

### 8️⃣ Test Health Endpoint (30 seconds)

Open browser or run:

```bash
curl http://localhost:5000/api/health
```

**Expected response:**

```json
{
  "status": "success",
  "message": "AayuCare Backend Server is running",
  "databases": {
    "mongodb": "connected",
    "postgresql": "connected",
    "redis": "connected"
  },
  "betterAuth": "initialized"
}
```

---

## ✅ You're Ready!

### What You Have Now:

✅ **PostgreSQL** - Relational data (users, appointments, payments)
✅ **MongoDB** - Document data (medical records, AI analysis)
✅ **Redis** - Caching & sessions (performance boost)
✅ **ACID Transactions** - No partial data corruption
✅ **Repository Pattern** - Clean code architecture
✅ **Validation Layer** - Prevent bad data
✅ **Caching Layer** - Fast response times

### Architecture Benefits:

- 🔒 **No SQL Injection** - Parameterized queries
- 🔄 **Atomic Operations** - Appointment + Payment together
- ⚡ **Fast Queries** - Indexed searches
- 🛡️ **Data Integrity** - Foreign key constraints
- 📈 **Scalable** - Connection pooling
- 🧹 **Maintainable** - Clean separation of concerns

---

## 🧪 Quick Test

### Test User Registration:

```bash
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test User",
    "email": "test@aayucare.com",
    "phone": "+911234567890",
    "password": "Test@123",
    "role": "doctor",
    "hospitalId": "MAIN",
    "hospitalName": "Main Hospital",
    "specialization": "Cardiology",
    "qualification": "MBBS, MD",
    "experience": 5,
    "consultationFee": 500
  }'
```

**This will:**

1. Validate the request (Joi schema)
2. Create user in PostgreSQL
3. Create doctor profile in PostgreSQL
4. Use transaction (both succeed or both fail)
5. Hash password with bcrypt
6. Return success response

---

## 🔍 Monitoring

### View Database Tables:

```bash
psql -U aayucare_admin -d aayucare_db

# Inside psql:
SELECT COUNT(*) FROM users;
SELECT * FROM appointments LIMIT 5;
\d appointments  # Show table structure
```

### View Redis Cache:

```bash
redis-cli

# Inside redis:
KEYS *                    # List all keys
GET cache:doctors:all     # View cached data
DBSIZE                    # Number of keys
```

### View Application Logs:

```bash
# In backend folder:
tail -f logs/combined.log
tail -f logs/error.log
```

---

## ⚠️ Troubleshooting

### PostgreSQL won't connect?

```bash
# Check if running:
# Windows: Check Services app
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Restart:
# Windows: Restart PostgreSQL service
# Mac: brew services restart postgresql
# Linux: sudo systemctl restart postgresql
```

### Redis won't connect?

```bash
# Start Redis:
# Windows: Run redis-server.exe
# Mac: brew services start redis
# Linux: sudo systemctl start redis

# Test:
redis-cli ping  # Should return PONG
```

### Schema initialization fails?

```bash
# Drop and recreate:
psql -U aayucare_admin -d aayucare_db
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# Re-initialize:
npm run init:postgres
```

---

## 📚 Next Steps

1. ✅ **Server is running** - All databases connected
2. 🔄 **Refactor services** - Replace Mongoose with repositories (optional, non-breaking)
3. 🧪 **Test endpoints** - Use Postman or curl
4. 📱 **Connect frontend** - No changes needed to frontend
5. 🚀 **Deploy** - Follow deployment checklist in IMPLEMENTATION_SUMMARY.md

---

## 🆘 Need Help?

1. Check `SETUP_GUIDE.md` for detailed setup
2. Check `IMPLEMENTATION_SUMMARY.md` for architecture details
3. View logs in `backend/logs/`
4. Test health endpoint: `http://localhost:5000/api/health`

---

## 🎯 Key Commands

```bash
# Development
npm run dev              # Start with auto-reload

# Database
npm run init:postgres    # Initialize PostgreSQL schema

# Production
npm start                # Start server

# Health Check
curl http://localhost:5000/api/health
```

---

**Status**: ✅ Ready for Development
**Setup Time**: ~15 minutes
**Breaking Changes**: None

Happy coding! 🚀
