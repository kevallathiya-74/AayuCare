/**
 * Create Better Auth Users
 * Creates test users directly in Better Auth format (user + account collections)
 */

const mongoose = require("mongoose");
require("dotenv").config();

const createUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.getClient().db("test");
    const userCollection = db.collection("user");
    const accountCollection = db.collection("account");

    // Test users to create
    const testUsers = [
      {
        userId: "ADM001",
        name: "Admin User",
        email: "admin@aayucare.com",
        phone: "+919876543210",
        password: "password123",
        role: "admin",
        department: "Administration",
        hospitalId: "HSP001",
        hospitalName: "AayuCare Main Hospital",
      },
      {
        userId: "DOC001",
        name: "Dr. Rajesh Kumar",
        email: "doctor@aayucare.com",
        phone: "+919876543211",
        password: "password123",
        role: "doctor",
        specialization: "Cardiology",
        qualification: "MBBS, MD (Cardiology)",
        experience: 10,
        consultationFee: 500,
        hospitalId: "HSP001",
        hospitalName: "AayuCare Main Hospital",
      },
      {
        userId: "PAT001",
        name: "Amit Patel",
        email: "patient@aayucare.com",
        phone: "+919876543212",
        password: "password123",
        role: "patient",
        dateOfBirth: new Date("1990-01-15"),
        gender: "male",
        bloodGroup: "O+",
        address: "Mumbai, Maharashtra, India",
        hospitalId: "HSP001",
        hospitalName: "AayuCare Main Hospital",
      },
    ];

    const bcrypt = require("bcryptjs");

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await userCollection.findOne({
        email: userData.email,
      });

      if (existingUser) {
        console.log(
          `⚠️  User ${userData.userId} (${userData.email}) already exists`
        );
        continue;
      }

      // Create user document
      const userDoc = {
        name: userData.name,
        email: userData.email,
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Custom fields
        userId: userData.userId,
        role: userData.role,
        hospitalId: userData.hospitalId,
        hospitalName: userData.hospitalName,
        phone: userData.phone,
        ...(userData.specialization && {
          specialization: userData.specialization,
        }),
        ...(userData.qualification && {
          qualification: userData.qualification,
        }),
        ...(userData.experience && { experience: userData.experience }),
        ...(userData.consultationFee && {
          consultationFee: userData.consultationFee,
        }),
        ...(userData.department && { department: userData.department }),
        ...(userData.dateOfBirth && { dateOfBirth: userData.dateOfBirth }),
        ...(userData.gender && { gender: userData.gender }),
        ...(userData.bloodGroup && { bloodGroup: userData.bloodGroup }),
        ...(userData.address && { address: userData.address }),
      };

      const insertedUser = await userCollection.insertOne(userDoc);
      const userId = insertedUser.insertedId;

      // Hash password using bcrypt (matching Better Auth config)
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create account document (credential provider)
      const accountDoc = {
        accountId: userId.toString(),
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await accountCollection.insertOne(accountDoc);

      console.log(`✅ Created user: ${userData.userId} (${userData.email})`);
    }

    console.log("\n✅ All users created successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("Admin:   ADM001 / password123  (admin@aayucare.com)");
    console.log("Doctor:  DOC001 / password123  (doctor@aayucare.com)");
    console.log("Patient: PAT001 / password123  (patient@aayucare.com)");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
};

createUsers();
