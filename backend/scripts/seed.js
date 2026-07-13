/**
 * AayuCare - Database Seed Script
 *
 * Populates the database with demo data for development.
 * Usage: node scripts/seed.js
 * WARNING: This will clear existing data in seeded tables.
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "..", ".env"),
});

const { query } = require("../src/config/postgres");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;
const DEMO_HOSPITAL_UUID = "550e8400-e29b-41d4-a716-446655440001";
const DEMO_HOSPITAL_ID = "HOSP1";
const DEMO_ADMIN_ID = "550e8400-e29b-41d4-a716-446655440010";
const DEMO_DOCTOR_ID = "550e8400-e29b-41d4-a716-446655440020";
const DEMO_PATIENT_ID = "550e8400-e29b-41d4-a716-446655440030";

const seed = async () => {
  console.log("[Seed] Starting database seed...");

  // Clear existing demo data
  await query("DELETE FROM appointments WHERE hospital_id = $1", [
    DEMO_HOSPITAL_ID,
  ]);
  await query("DELETE FROM schedules WHERE hospital_id = $1", [
    DEMO_HOSPITAL_ID,
  ]);
  await query("DELETE FROM prescriptions WHERE hospital_id = $1", [
    DEMO_HOSPITAL_ID,
  ]);
  await query("DELETE FROM notifications WHERE hospital_id = $1", [
    DEMO_HOSPITAL_ID,
  ]);
  await query("DELETE FROM events WHERE hospital_id = $1", [DEMO_HOSPITAL_ID]);
  await query("DELETE FROM doctors WHERE user_id IN ($1, $2, $3)", [
    DEMO_ADMIN_ID,
    DEMO_DOCTOR_ID,
    DEMO_PATIENT_ID,
  ]);
  await query("DELETE FROM patients WHERE user_id IN ($1, $2, $3)", [
    DEMO_ADMIN_ID,
    DEMO_DOCTOR_ID,
    DEMO_PATIENT_ID,
  ]);
  await query("DELETE FROM users WHERE hospital_id = $1", [DEMO_HOSPITAL_ID]);
  await query("DELETE FROM hospitals WHERE hospital_id = $1", [
    DEMO_HOSPITAL_ID,
  ]);

  const hashedPassword = await bcrypt.hash("Demo@123", SALT_ROUNDS);

  // Create hospital
  await query(
    `INSERT INTO hospitals (id, hospital_id, name, address, phone, email, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    [
      DEMO_HOSPITAL_UUID,
      DEMO_HOSPITAL_ID,
      "AayuCare Demo Hospital",
      "123 Healthcare Blvd",
      "+91-9876543210",
      "hospital@aayucare.com",
      true,
    ],
  );

  // Create users
  await query(
    `INSERT INTO users (id, user_id, name, email, password_hash, phone, role, hospital_id, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      DEMO_ADMIN_ID,
      "ADM1",
      "Admin User",
      "admin@aayucare.com",
      hashedPassword,
      "+91-9876543211",
      "admin",
      DEMO_HOSPITAL_ID,
      true,
    ],
  );
  await query(
    `INSERT INTO account (account_id, provider_id, user_id, password) VALUES ($1, $2, $3, $4)`,
    ["cred_adm1", "credential", DEMO_ADMIN_ID, hashedPassword],
  );

  await query(
    `INSERT INTO users (id, user_id, name, email, password_hash, phone, role, hospital_id, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      DEMO_DOCTOR_ID,
      "DOC1",
      "Dr. Sharma",
      "doctor@aayucare.com",
      hashedPassword,
      "+91-9876543212",
      "doctor",
      DEMO_HOSPITAL_ID,
      true,
    ],
  );
  await query(
    `INSERT INTO account (account_id, provider_id, user_id, password) VALUES ($1, $2, $3, $4)`,
    ["cred_doc1", "credential", DEMO_DOCTOR_ID, hashedPassword],
  );

  await query(
    `INSERT INTO users (id, user_id, name, email, password_hash, phone, role, hospital_id, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      DEMO_PATIENT_ID,
      "PAT1",
      "Rahul Patient",
      "patient@aayucare.com",
      hashedPassword,
      "+91-9876543213",
      "patient",
      DEMO_HOSPITAL_ID,
      true,
    ],
  );
  await query(
    `INSERT INTO account (account_id, provider_id, user_id, password) VALUES ($1, $2, $3, $4)`,
    ["cred_pat1", "credential", DEMO_PATIENT_ID, hashedPassword],
  );

  // Create doctor profile
  await query(
    `INSERT INTO doctors (id, user_id, specialization, qualification, experience, consultation_fee, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      DEMO_DOCTOR_ID,
      DEMO_DOCTOR_ID,
      "Cardiologist",
      "MBBS, MD (Cardiology)",
      12,
      800.0,
      "Experienced cardiologist specializing in preventive cardiology.",
    ],
  );

  // Create schedules (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const days = [1, 2, 3, 4, 5]; // Monday to Friday
  for (const day of days) {
    await query(
      `INSERT INTO schedules (doctor_id, hospital_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available, max_patients)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        DEMO_DOCTOR_ID,
        DEMO_HOSPITAL_ID,
        day,
        "09:00:00",
        "17:00:00",
        15,
        true,
        20,
      ],
    );
  }

  // Create patient profile
  await query(
    `INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      DEMO_PATIENT_ID,
      DEMO_PATIENT_ID,
      "1990-05-15",
      "male",
      "O+",
      "456 Patient Lane",
    ],
  );

  console.log("[Seed] Database seeded successfully!");
  console.log("[Seed] Demo credentials:");
  console.log("  Admin:  admin@aayucare.com / Demo@123");
  console.log("  Doctor: doctor@aayucare.com / Demo@123");
  console.log("  Patient: patient@aayucare.com / Demo@123");
  process.exit(0);
};

seed().catch((err) => {
  console.error("[Seed] Failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
