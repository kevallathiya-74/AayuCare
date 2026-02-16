/**
 * Manual MongoDB Insert Script
 * Use this if seedDevUsers.js fails due to connection issues
 * Copy-paste these commands directly into MongoDB Compass or Atlas shell
 */

// Switch to aayucare database
use aayucare

// 1. Insert Admin User
db.user.insertOne({
  "userId": "ADMIN",
  "name": "Rajesh Kumar",
  "email": "admin@aayucare.com",
  "phone": "+919876543210",
  "password": "$2b$12$mWNVY9gySr6AkI8YTZcTLuXuvls4TvK9fmpPNQWShaPewHNXYoH5q", // password123
  "role": "admin",
  "hospitalId": "HOSP001",
  "hospitalName": "AayuCare Hospital",
  "department": "Administration",
  "isActive": true,
  "isVerified": true,
  "tokenVersion": 0,
  "createdAt": new Date(),
  "updatedAt": new Date()
})

// 2. Insert Doctor User
db.user.insertOne({
  "userId": "DOCTOR",
  "name": "Dr. Priya Sharma",
  "email": "doctor@aayucare.com",
  "phone": "+919876543211",
  "password": "$2b$12$lEx.kJMlJV7Ow.pzfwn2.uaCC1Qm7tzNG0Z1qydsOUXgigFgRBxf.", // password123
  "role": "doctor",
  "hospitalId": "HOSP001",
  "hospitalName": "AayuCare Hospital",
  "specialization": "General Physician",
  "qualification": "MBBS, MD (Internal Medicine)",
  "experience": 8,
  "consultationFee": 500,
  "isActive": true,
  "isVerified": true,
  "tokenVersion": 0,
  "createdAt": new Date(),
  "updatedAt": new Date()
})

// 3. Insert Patient User
db.user.insertOne({
  "userId": "PATIENT",
  "name": "Amit Patel",
  "email": "patient@aayucare.com",
  "phone": "+919876543212",
  "password": "$2b$12$5eKRzU53XwJI24/JAuyRwu15938zDVZHH1nEdSfCwYwb2jYuh.r/i", // password123
  "role": "patient",
  "hospitalId": "HOSP001",
  "hospitalName": "AayuCare Hospital",
  "dateOfBirth": new Date("1990-05-15"),
  "gender": "male",
  "bloodGroup": "O+",
  "address": "123 MG Road, Bangalore, Karnataka 560001",
  "emergencyContact": {
    "name": "Sunita Patel",
    "phone": "+919876543213",
    "relation": "Spouse"
  },
  "allergies": ["Penicillin"],
  "currentMedications": ["Vitamin D3"],
  "medicalHistory": [
    {
      "condition": "Hypertension",
      "diagnosedDate": new Date("2020-01-15"),
      "status": "active"
    }
  ],
  "isActive": true,
  "isVerified": true,
  "tokenVersion": 0,
  "createdAt": new Date(),
  "updatedAt": new Date()
})

// Verify insertion
db.user.find({ userId: { $in: ["ADMIN", "DOCTOR", "PATIENT"] } }).pretty()

/*
CREDENTIALS FOR MOBILE APP:

1. ADMIN:
   User ID: admin
   Password: password123

2. DOCTOR:
   User ID: doctor
   Password: password123

3. PATIENT:
   User ID: patient
   Password: password123
*/
