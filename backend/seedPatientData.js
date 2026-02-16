/**
 * Seed Patient Data Script
 * Creates a complete patient record with medical history, appointments, records, and prescriptions
 * Run: node seedPatientData.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./src/models/User");
const Appointment = require("./src/models/Appointment");
const MedicalRecord = require("./src/models/MedicalRecord");
const Prescription = require("./src/models/Prescription");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get existing doctor
    const doctor = await User.findOne({ role: "doctor" });
    if (!doctor) {
      console.error("❌ No doctor found. Please create a doctor first.");
      process.exit(1);
    }
    console.log(`✅ Found doctor: ${doctor.name} (${doctor._id})`);

    // Find or create patient with complete details
    let patient = await User.findOne({ userId: "PATIENT" });

    if (!patient) {
      console.log("Creating new patient...");
      patient = await User.create({
        userId: "PATIENT",
        name: "Keval Lathiya",
        email: "patient@aayucare.com",
        phone: "+911234567892",
        password: "password123",
        role: "patient",
        hospitalId: "HOSP001",
        hospitalName: "AayuCare Hospital",
        dateOfBirth: new Date("1985-05-15"),
        gender: "male",
        bloodGroup: "O+",
        address: "123 Main Street, Andheri West, Mumbai, Maharashtra 400058",
        emergencyContact: {
          name: "Jane Smith",
          phone: "+911234567893",
          relation: "Spouse",
        },
        allergies: ["Penicillin", "Dust", "Pollen"],
        currentMedications: ["Aspirin 75mg", "Vitamin D3", "Omega-3"],
        medicalHistory: [
          {
            condition: "Hypertension",
            diagnosedDate: new Date("2020-03-10"),
            status: "active",
          },
          {
            condition: "Type 2 Diabetes",
            diagnosedDate: new Date("2019-08-22"),
            status: "active",
          },
          {
            condition: "Seasonal Allergies",
            diagnosedDate: new Date("2015-01-05"),
            status: "chronic",
          },
        ],
        isActive: true,
        isVerified: true,
      });
      console.log("✅ Patient created");
    } else {
      // Update existing patient with complete data
      patient.allergies = ["Penicillin", "Dust", "Pollen"];
      patient.currentMedications = ["Aspirin 75mg", "Vitamin D3", "Omega-3"];
      patient.medicalHistory = [
        {
          condition: "Hypertension",
          diagnosedDate: new Date("2020-03-10"),
          status: "active",
        },
        {
          condition: "Type 2 Diabetes",
          diagnosedDate: new Date("2019-08-22"),
          status: "active",
        },
        {
          condition: "Seasonal Allergies",
          diagnosedDate: new Date("2015-01-05"),
          status: "chronic",
        },
      ];
      patient.address =
        "123 Main Street, Andheri West, Mumbai, Maharashtra 400058";
      patient.emergencyContact = {
        name: "Jane Smith",
        phone: "+911234567893",
        relation: "Spouse",
      };
      await patient.save();
      console.log("✅ Patient updated with complete details");
    }

    // Create appointments
    console.log("\n📅 Creating appointments...");

    const appointments = [
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        appointmentDate: new Date("2026-02-05"),
        appointmentTime: "10:30 AM",
        status: "completed",
        type: "clinic_visit",
        chiefComplaint: "Regular diabetes checkup",
        reason: "Follow-up consultation",
        payment: { amount: 500, status: "paid" },
      },
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        appointmentDate: new Date("2026-02-10"),
        appointmentTime: "02:00 PM",
        status: "completed",
        type: "clinic_visit",
        chiefComplaint: "Blood pressure monitoring",
        reason: "Hypertension review",
        payment: { amount: 500, status: "paid" },
      },
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        appointmentDate: new Date("2026-02-15"),
        appointmentTime: "11:00 AM",
        status: "confirmed",
        type: "telemedicine",
        chiefComplaint: "Medication refill consultation",
        reason: "Routine checkup",
        payment: { amount: 300, status: "pending" },
      },
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        appointmentDate: new Date("2026-02-20"),
        appointmentTime: "03:30 PM",
        status: "scheduled",
        type: "clinic_visit",
        chiefComplaint: "General health checkup",
        reason: "Annual physical examination",
        payment: { amount: 500, status: "pending" },
      },
    ];

    // Delete existing appointments to avoid duplicates
    await Appointment.deleteMany({
      patientId: patient._id,
      doctorId: doctor._id,
    });

    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`✅ Created ${createdAppointments.length} appointments`);

    // Create medical records
    console.log("\n📋 Creating medical records...");

    const medicalRecords = [
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        recordType: "lab_report",
        title: "Complete Blood Count (CBC)",
        description: "Routine blood test to check overall health",
        date: new Date("2026-02-05"),
        diagnosis: "All parameters within normal range",
        notes: "Hemoglobin: 14.5 g/dL, WBC: 7500/µL, Platelets: 250000/µL",
      },
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        recordType: "test_result",
        title: "HbA1c Test",
        description: "Diabetes monitoring test",
        date: new Date("2026-02-05"),
        diagnosis: "Good diabetic control",
        notes: "HbA1c level: 6.8% (Target <7%)",
      },
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        recordType: "doctor_visit",
        title: "Hypertension Review",
        description: "Blood pressure monitoring and medication review",
        date: new Date("2026-02-10"),
        diagnosis: "Blood pressure controlled with current medication",
        notes: "BP: 128/82 mmHg. Continue current antihypertensive therapy.",
      },
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        recordType: "imaging",
        title: "Chest X-Ray",
        description: "Annual chest radiograph",
        date: new Date("2026-01-20"),
        diagnosis: "Normal chest X-ray",
        notes: "No acute cardiopulmonary findings. Heart size normal.",
      },
    ];

    // Delete existing records to avoid duplicates
    await MedicalRecord.deleteMany({
      patientId: patient._id,
      doctorId: doctor._id,
    });

    const createdRecords = await MedicalRecord.insertMany(medicalRecords);
    console.log(`✅ Created ${createdRecords.length} medical records`);

    // Create prescriptions
    console.log("\n💊 Creating prescriptions...");

    const prescriptions = [
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        appointmentId: createdAppointments[0]._id,
        prescriptionDate: new Date("2026-02-05"),
        diagnosis:
          "Type 2 Diabetes Mellitus with controlled blood sugar levels",
        medicines: [
          {
            name: "Metformin",
            genericName: "Metformin Hydrochloride",
            dosage: "500mg",
            frequency: "Twice daily",
            duration: "30 days",
            timing: "after_food",
            instructions: "Take with meals to reduce stomach upset",
          },
          {
            name: "Glimepiride",
            genericName: "Glimepiride",
            dosage: "2mg",
            frequency: "Once daily",
            duration: "30 days",
            timing: "before_food",
            instructions: "Take 30 minutes before breakfast",
          },
        ],
        notes:
          "Continue regular blood sugar monitoring. Follow diabetic diet plan.",
        followUpDate: new Date("2026-03-05"),
      },
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        appointmentId: createdAppointments[1]._id,
        prescriptionDate: new Date("2026-02-10"),
        diagnosis: "Essential Hypertension - Stage 1",
        medicines: [
          {
            name: "Amlodipine",
            genericName: "Amlodipine Besylate",
            dosage: "5mg",
            frequency: "Once daily",
            duration: "30 days",
            timing: "anytime",
            instructions: "Take at the same time each day, morning preferred",
          },
          {
            name: "Aspirin",
            genericName: "Acetylsalicylic Acid",
            dosage: "75mg",
            frequency: "Once daily",
            duration: "30 days",
            timing: "after_food",
            instructions: "Take after dinner to prevent cardiovascular events",
          },
        ],
        notes:
          "Monitor blood pressure at home. Maintain low-salt diet. Regular exercise recommended.",
        followUpDate: new Date("2026-03-10"),
      },
      {
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: "HOSP001",
        prescriptionDate: new Date("2026-01-15"),
        diagnosis: "Seasonal Allergic Rhinitis",
        medicines: [
          {
            name: "Cetirizine",
            genericName: "Cetirizine Hydrochloride",
            dosage: "10mg",
            frequency: "Once daily",
            duration: "14 days",
            timing: "anytime",
            instructions: "Take at bedtime. May cause drowsiness.",
          },
          {
            name: "Fluticasone Nasal Spray",
            genericName: "Fluticasone Propionate",
            dosage: "2 sprays each nostril",
            frequency: "Once daily",
            duration: "14 days",
            timing: "anytime",
            instructions: "Use in the morning. Shake well before use.",
          },
        ],
        notes:
          "Avoid known allergens. Keep windows closed during high pollen days.",
      },
    ];

    // Delete existing prescriptions to avoid duplicates
    await Prescription.deleteMany({
      patientId: patient._id,
      doctorId: doctor._id,
    });

    const createdPrescriptions = await Prescription.insertMany(prescriptions);
    console.log(`✅ Created ${createdPrescriptions.length} prescriptions`);

    // Summary
    console.log("\n✅ ============================================");
    console.log("✅ SEED DATA CREATION COMPLETED SUCCESSFULLY");
    console.log("✅ ============================================");
    console.log(`\n📊 Summary:`);
    console.log(`   Patient: ${patient.name} (ID: ${patient._id})`);
    console.log(`   Doctor: ${doctor.name} (ID: ${doctor._id})`);
    console.log(`   Appointments: ${createdAppointments.length}`);
    console.log(`   Medical Records: ${createdRecords.length}`);
    console.log(`   Prescriptions: ${createdPrescriptions.length}`);
    console.log(`   Allergies: ${patient.allergies.length}`);
    console.log(`   Current Medications: ${patient.currentMedications.length}`);
    console.log(
      `   Medical History Conditions: ${patient.medicalHistory.length}`
    );

    console.log("\n🎯 Patient Details:");
    console.log(`   Name: ${patient.name}`);
    console.log(`   User ID: ${patient.userId}`);
    console.log(`   Email: ${patient.email}`);
    console.log(`   Phone: ${patient.phone}`);
    console.log(`   Blood Group: ${patient.bloodGroup}`);
    console.log(
      `   Age: ${
        new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
      } years`
    );

    console.log("\n🔑 To test the API:");
    console.log(`   1. Login as doctor (email: ${doctor.email})`);
    console.log(`   2. Navigate to Manage Patients`);
    console.log(`   3. Click on patient card: ${patient.name}`);
    console.log(`   4. View complete patient details with all tabs`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
