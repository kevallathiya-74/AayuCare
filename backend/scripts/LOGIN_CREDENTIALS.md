# 🔐 AayuCare - Login Credentials Reference Card

## Quick Access Credentials

**Common Password for ALL users:** `password123`

---

## 👤 ADMIN USERS (1)

| Name       | Email           | Phone      | User ID |
| ---------- | --------------- | ---------- | ------- |
| Admin User | admin@gmail.com | 9000000001 | adm1    |

---

## 👨‍⚕️ DOCTOR USERS (1)

| Name            | Specialization    | Email            | Phone      | Fee   | User ID |
| --------------- | ----------------- | ---------------- | ---------- | ----- | ------- |
| Dr. Doctor User | General Physician | doctor@gmail.com | 9000000002 | ₹1000 | doc1    |

---

## 🩺 PATIENT USERS (1)

| Name         | Email             | Phone      | Blood Group | User ID |
| ------------ | ----------------- | ---------- | ----------- | ------- |
| Patient User | patient@gmail.com | 9000000003 | O+          | pat1    |

---

## 🚀 Quick Login Examples

### Admin Login

```
Email: admin@gmail.com
Password: password123
```

### Doctor Login

```
Email: doctor@gmail.com
Password: password123
```

### Patient Login

```
Email: patient@gmail.com
Password: password123
```

---

## 📱 Testing Workflow

1. **Login as Patient** (patient@gmail.com)
   - View available doctors
   - Book appointment with Dr. Amit Patel (Cardiologist)
   - View appointment details

2. **Login as Doctor** (doctor@gmail.com)
   - View patient appointments
   - Update appointment status
   - Add prescriptions

3. **Login as Admin** (admin@gmail.com)
   - View all users
   - Manage appointments
   - View system reports

---

## 🗄️ Database Verification Commands

```bash
# View all users by role
psql -U aayucare_admin -d aayucare_db -c "SELECT role, COUNT(*) FROM users GROUP BY role;"

# View all doctors with details
psql -U aayucare_admin -d aayucare_db -c "SELECT u.name, d.specialization, d.consultation_fee FROM users u JOIN doctors d ON u.id = d.user_id;"

# View all patients with details
psql -U aayucare_admin -d aayucare_db -c "SELECT u.name, p.blood_group, p.gender FROM users u JOIN patients p ON u.id = p.user_id;"
```

---

## 🔄 Re-seed Database

If you want to start fresh:

```bash
# Delete all users (cascade will delete related data)
psql -U aayucare_admin -d aayucare_db -c "TRUNCATE users CASCADE;"

# Re-run seed script
cd d:\AayuCare\backend
npm run seed:db
```

---

## 📋 NPM Commands

| Command              | Description             |
| -------------------- | ----------------------- |
| `npm run seed:db`    | Seed sample data        |
| `npm run setup:full` | Full setup with seeding |
| `npm run dev`        | Start backend server    |

---

**⚠️ SECURITY WARNING:**  
This is **DEMO DATA** only! Never use these passwords in production.

---

**Generated:** February 17, 2026  
**Project:** AayuCare Healthcare Management System
