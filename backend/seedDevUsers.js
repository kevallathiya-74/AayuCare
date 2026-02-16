/**
 * Development User Seed Script
 * Creates admin, doctor, and patient users with Indian names
 *
 * Usage: node seedDevUsers.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const MONGODB_URI = process.env.MONGODB_URI;
const HOSPITAL_ID = "HOSP001";
const HOSPITAL_NAME = "AayuCare Hospital";

// Development users with Indian names
const devUsers = [
  {
    userId: "ADMIN",
    name: "Rajesh Kumar",
    email: "admin@aayucare.com",
    phone: "+919876543210",
    password: "password123",
    role: "admin",
    hospitalId: HOSPITAL_ID,
    hospitalName: HOSPITAL_NAME,
    department: "Administration",
    isActive: true,
    isVerified: true,
  },
  {
    userId: "DOCTOR",
    name: "Dr. Priya Sharma",
    email: "doctor@aayucare.com",
    phone: "+919876543211",
    password: "password123",
    role: "doctor",
    hospitalId: HOSPITAL_ID,
    hospitalName: HOSPITAL_NAME,
    specialization: "General Physician",
    qualification: "MBBS, MD (Internal Medicine)",
    experience: 8,
    consultationFee: 500,
    isActive: true,
    isVerified: true,
  },
  {
    userId: "PATIENT",
    name: "Amit Patel",
    email: "patient@aayucare.com",
    phone: "+919876543212",
    password: "password123",
    role: "patient",
    hospitalId: HOSPITAL_ID,
    hospitalName: HOSPITAL_NAME,
    dateOfBirth: new Date("1990-05-15"),
    gender: "male",
    bloodGroup: "O+",
    address: "123 MG Road, Bangalore, Karnataka 560001",
    emergencyContact: {
      name: "Sunita Patel",
      phone: "+919876543213",
      relation: "Spouse",
    },
    allergies: ["Penicillin"],
    currentMedications: ["Vitamin D3"],
    medicalHistory: [
      {
        condition: "Hypertension",
        diagnosedDate: new Date("2020-01-15"),
        status: "active",
      },
    ],
    isActive: true,
    isVerified: true,
  },
];

async function seedDevUsers() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    console.log(
      `📍 URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`
    );

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);

    console.log("\n🗑️  Removing existing dev users...");
    const deleteResult = await User.deleteMany({
      userId: { $in: ["ADMIN", "DOCTOR", "PATIENT"] },
    });
    console.log(`✅ Removed ${deleteResult.deletedCount} existing dev users`);

    console.log("\n👥 Creating development users...");
    for (const userData of devUsers) {
      try {
        const user = await User.create(userData);
        console.log(`✅ Created ${user.role.toUpperCase()}: ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 User ID: ${user.userId}`);
        console.log(`   📱 Phone: ${user.phone}`);
        console.log(
          `   🔑 Password: password123 (use in mobile app for testing)\n`
        );
      } catch (err) {
        console.error(`❌ Failed to create ${userData.role}:`, err.message);
      }
    }

    console.log("\n📊 Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Development Credentials Created:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n1️⃣  ADMIN:");
    console.log("   User ID: admin");
    console.log("   Password: password123");
    console.log("   Name: Rajesh Kumar");
    console.log("   Email: admin@aayucare.com");
    console.log("\n2️⃣  DOCTOR:");
    console.log("   User ID: doctor");
    console.log("   Password: password123");
    console.log("   Name: Dr. Priya Sharma");
    console.log("   Email: doctor@aayucare.com");
    console.log("   Specialization: General Physician");
    console.log("   Fee: ₹500");
    console.log("\n3️⃣  PATIENT:");
    console.log("   User ID: patient");
    console.log("   Password: password123");
    console.log("   Name: Amit Patel");
    console.log("   Email: patient@aayucare.com");
    console.log("   Blood Group: O+");
    console.log("   Age: 35 years");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✨ Use these credentials in mobile app for testing");
    console.log("🏥 Hospital: AayuCare Hospital (HOSP001)");
    console.log("\n✅ SEED COMPLETED SUCCESSFULLY");
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

seedDevUsers();
