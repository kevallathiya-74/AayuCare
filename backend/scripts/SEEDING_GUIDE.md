# AayuCare Database Seeding Guide

## 🎯 Quick Start

After setting up PostgreSQL, run:

```bash
cd d:\AayuCare\backend
npm run seed:db
```

## 📋 What Gets Created

### 👤 2 Admins
| Name | Email | Phone | Password |
|------|-------|-------|----------|
| Rajesh Kumar | rajesh.kumar@aayucare.com | 9876543210 | password123 |
| Priya Sharma | priya.sharma@aayucare.com | 9876543211 | password123 |

### 👨‍⚕️ 5 Doctors
| Name | Specialization | Email | Phone | Fee | Password |
|------|----------------|-------|-------|-----|----------|
| Dr. Amit Patel | Cardiologist | amit.patel@aayucare.com | 9876543220 | ₹1000 | password123 |
| Dr. Sneha Desai | Pediatrician | sneha.desai@aayucare.com | 9876543221 | ₹800 | password123 |
| Dr. Vikram Singh | Orthopedic Surgeon | vikram.singh@aayucare.com | 9876543222 | ₹1200 | password123 |
| Dr. Kavita Mehta | Dermatologist | kavita.mehta@aayucare.com | 9876543223 | ₹900 | password123 |
| Dr. Arjun Reddy | General Physician | arjun.reddy@aayucare.com | 9876543224 | ₹700 | password123 |

### 🩺 8 Patients
| Name | Email | Phone | Blood Group | Password |
|------|-------|-------|-------------|----------|
| Rahul Verma | rahul.verma@gmail.com | 9876543230 | O+ | password123 |
| Anjali Gupta | anjali.gupta@gmail.com | 9876543232 | A+ | password123 |
| Sanjay Joshi | sanjay.joshi@gmail.com | 9876543234 | B+ | password123 |
| Meera Nair | meera.nair@gmail.com | 9876543236 | AB+ | password123 |
| Karan Malhotra | karan.malhotra@gmail.com | 9876543238 | O- | password123 |
| Pooja Iyer | pooja.iyer@gmail.com | 9876543240 | A- | password123 |
| Arun Kumar | arun.kumar@gmail.com | 9876543242 | B- | password123 |
| Divya Shah | divya.shah@gmail.com | 9876543244 | O+ | password123 |

## 🔐 Login Credentials

**Common Password for ALL users:** `password123`

### Test Login Examples:

**Admin:**
- Email: `rajesh.kumar@aayucare.com`
- Password: `password123`

**Doctor:**
- Email: `amit.patel@aayucare.com`
- Password: `password123`

**Patient:**
- Email: `rahul.verma@gmail.com`
- Password: `password123`

## 📝 Complete Setup Steps

### 1. First Time Setup (Complete All Steps)

```powershell
# 1. Install PostgreSQL and create database (one-time)
cd d:\AayuCare\backend
.\setup-database.ps1

# 2. Install dependencies
npm install

# 3. Run full setup (creates tables + seeds data)
npm run setup:full
```

### 2. Seed Only (If Tables Already Exist)

```bash
npm run seed:db
```

### 3. Re-seed (Delete old data and re-seed)

```bash
# Delete all users first (be careful!)
psql -U aayucare_admin -d aayucare_db -c "TRUNCATE users CASCADE;"

# Then seed again
npm run seed:db
```

## 🔄 Available NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run seed:db` | Seed sample data (admins, doctors, patients) |
| `npm run init:postgres` | Initialize PostgreSQL schema |
| `npm run cleanup:db` | Clean up old/test data |
| `npm run setup` | Full setup without seeding |
| `npm run setup:full` | Full setup WITH seeding |

## ✅ Verification

After seeding, verify in PostgreSQL:

```sql
-- Connect to database
psql -U aayucare_admin -d aayucare_db

-- Check users
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Should show:
--  role    | count
-- ---------+-------
--  admin   |     2
--  doctor  |     5
--  patient |     8

-- Check doctors with details
SELECT u.name, d.specialization, d.consultation_fee 
FROM users u 
JOIN doctors d ON u.id = d.user_id;

-- Check patients
SELECT u.name, p.blood_group, p.gender 
FROM users u 
JOIN patients p ON u.id = p.user_id;
```

## 🚀 Testing Frontend Connection

### Login from Mobile App

1. Open AayuCare mobile app
2. Click "Login"
3. Enter any email from the tables above
4. Enter password: `password123`
5. Should successfully login and see dashboard

### Test Different Roles

**Admin Role:**
- Can see all appointments
- Can manage users
- Can access admin panel

**Doctor Role:**
- Can see assigned patients
- Can view/update appointments
- Can prescribe medications

**Patient Role:**
- Can book appointments
- Can view medical records
- Can see prescriptions

## 🔒 Security Notes

⚠️ **IMPORTANT:**
- This is DEMO DATA for development/testing only
- **NEVER use in production** with these passwords
- All users have the same password (`password123`) for easy testing
- In production, users must set unique strong passwords

## 🛠️ Troubleshooting

### Error: "User already exists"
**Solution:** Script automatically skips existing users. This is safe.

### Error: "Password authentication failed"
**Solution:** Check your .env file:
```env
POSTGRES_USER=aayucare_admin
POSTGRES_PASSWORD=aayucare123
POSTGRES_DB=aayucare_db
```

### Error: "relation users does not exist"
**Solution:** Run schema setup first:
```bash
npm run init:postgres
```

### Want to start fresh?
```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE aayucare_db;
CREATE DATABASE aayucare_db OWNER aayucare_admin;
\q

# Run full setup
npm run setup:full
```

## 📊 Data Structure

### Doctor Availability Format
```json
{
  "monday": ["09:00-12:00", "14:00-17:00"],
  "tuesday": ["09:00-12:00", "14:00-17:00"],
  "wednesday": ["09:00-12:00"],
  "thursday": ["09:00-12:00", "14:00-17:00"],
  "friday": ["09:00-12:00", "14:00-17:00"],
  "saturday": ["09:00-13:00"]
}
```

### Patient Profile Fields
- Date of Birth
- Gender (male/female/other)
- Blood Group (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Address (full address with city and pincode)
- Emergency Contact (name + phone)
- Allergies (array)
- Chronic Conditions (array)

## 🎯 Next Steps After Seeding

1. ✅ Start backend server: `npm run dev`
2. ✅ Start frontend: Navigate to frontend folder and run
3. ✅ Test login with any seeded user
4. ✅ Book appointments between patients and doctors
5. ✅ Test all role-based features

## 📞 Support

If you encounter any issues:
1. Check PostgreSQL is running
2. Verify .env configuration
3. Check logs in `backend/logs/` folder
4. Ensure all tables exist: `psql -U aayucare_admin -d aayucare_db -c "\dt"`

---

**Happy Testing! 🎉**
