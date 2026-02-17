# 🔐 AayuCare - Login Credentials Reference Card

## Quick Access Credentials
**Common Password for ALL users:** `password123`

---

## 👤 ADMIN USERS (2)

| Name | Email | Phone | User ID |
|------|-------|-------|---------|
| Rajesh Kumar | rajesh.kumar@aayucare.com | 9876543210 | ADM001 |
| Priya Sharma | priya.sharma@aayucare.com | 9876543211 | ADM002 |

---

## 👨‍⚕️ DOCTOR USERS (5)

| Name | Specialization | Email | Phone | Fee | User ID |
|------|----------------|-------|-------|-----|---------|
| Dr. Amit Patel | Cardiologist | amit.patel@aayucare.com | 9876543220 | ₹1000 | DOC001 |
| Dr. Sneha Desai | Pediatrician | sneha.desai@aayucare.com | 9876543221 | ₹800 | DOC002 |
| Dr. Vikram Singh | Orthopedic Surgeon | vikram.singh@aayucare.com | 9876543222 | ₹1200 | DOC003 |
| Dr. Kavita Mehta | Dermatologist | kavita.mehta@aayucare.com | 9876543223 | ₹900 | DOC004 |
| Dr. Arjun Reddy | General Physician | arjun.reddy@aayucare.com | 9876543224 | ₹700 | DOC005 |

---

## 🩺 PATIENT USERS (8)

| Name | Email | Phone | Blood Group | User ID |
|------|-------|-------|-------------|---------|
| Rahul Verma | rahul.verma@gmail.com | 9876543230 | O+ | PAT001 |
| Anjali Gupta | anjali.gupta@gmail.com | 9876543232 | A+ | PAT002 |
| Sanjay Joshi | sanjay.joshi@gmail.com | 9876543234 | B+ | PAT003 |
| Meera Nair | meera.nair@gmail.com | 9876543236 | AB+ | PAT004 |
| Karan Malhotra | karan.malhotra@gmail.com | 9876543238 | O- | PAT005 |
| Pooja Iyer | pooja.iyer@gmail.com | 9876543240 | A- | PAT006 |
| Arun Kumar | arun.kumar@gmail.com | 9876543242 | B- | PAT007 |
| Divya Shah | divya.shah@gmail.com | 9876543244 | O+ | PAT008 |

---

## 🚀 Quick Login Examples

### Admin Login
```
Email: rajesh.kumar@aayucare.com
Password: password123
```

### Doctor Login
```
Email: amit.patel@aayucare.com
Password: password123
```

### Patient Login
```
Email: rahul.verma@gmail.com
Password: password123
```

---

## 📱 Testing Workflow

1. **Login as Patient** (rahul.verma@gmail.com)
   - View available doctors
   - Book appointment with Dr. Amit Patel (Cardiologist)
   - View appointment details

2. **Login as Doctor** (amit.patel@aayucare.com)
   - View patient appointments
   - Update appointment status
   - Add prescriptions

3. **Login as Admin** (rajesh.kumar@aayucare.com)
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

| Command | Description |
|---------|-------------|
| `npm run seed:db` | Seed sample data |
| `npm run setup:full` | Full setup with seeding |
| `npm run dev` | Start backend server |

---

**⚠️ SECURITY WARNING:**  
This is **DEMO DATA** only! Never use these passwords in production.

---

**Generated:** February 17, 2026  
**Project:** AayuCare Healthcare Management System
