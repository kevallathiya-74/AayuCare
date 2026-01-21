/**
 * Create Simple Test Users
 * Creates 3 test users: admin, patient, doctor
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;

async function createTestUsers() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    const db = mongoose.connection.db;
    const userCollection = db.collection("user");
    const accountCollection = db.collection("account");

    const testUsers = [
      {
        userId: "admin",
        email: "admin@aayucare.com",
        name: "Admin User",
        role: "admin",
        phone: "1234567890",
        hospitalId: "HOSP001",
        hospitalName: "AayuCare Hospital",
        isActive: true,
        isVerified: true,
      },
      {
        userId: "patient",
        email: "patient@aayucare.com",
        name: "Test Patient",
        role: "patient",
        phone: "9876543210",
        hospitalId: "HOSP001",
        hospitalName: "AayuCare Hospital",
        dateOfBirth: new Date("1990-01-15"),
        gender: "male",
        isActive: true,
        isVerified: true,
      },
      {
        userId: "doctor",
        email: "doctor@aayucare.com",
        name: "Dr. Test Doctor",
        role: "doctor",
        phone: "9876543211",
        hospitalId: "HOSP001",
        hospitalName: "AayuCare Hospital",
        specialization: "General Medicine",
        qualification: "MBBS, MD",
        experience: 10,
        consultationFee: 500,
        isActive: true,
        isVerified: true,
      },
    ];

    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log("🔄 Creating test users...\n");

    for (const userData of testUsers) {
      // Check if user exists
      const existingUser = await userCollection.findOne({
        $or: [{ userId: userData.userId }, { email: userData.email }],
      });

      if (existingUser) {
        console.log(
          `⚠️  ${userData.role.toUpperCase()} user already exists, updating...`
        );

        // Update user
        await userCollection.updateOne(
          { _id: existingUser._id },
          {
            $set: {
              ...userData,
              updatedAt: new Date(),
            },
          }
        );

        // Update password
        await accountCollection.updateOne(
          { userId: existingUser._id },
          {
            $set: {
              password: hashedPassword,
              updatedAt: new Date(),
            },
          }
        );

        console.log(`✅ Updated: ${userData.userId} (${userData.role})`);
      } else {
        // Create new user
        const userDoc = {
          ...userData,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await userCollection.insertOne(userDoc);
        const userId = result.insertedId;

        // Create account with password
        await accountCollection.insertOne({
          userId: userId,
          accountId: userId.toString(),
          providerId: "credential",
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✅ Created: ${userData.userId} (${userData.role})`);
      }
    }

    console.log("\n✅ Test users ready!\n");
    console.log("📋 Login Credentials:");
    console.log("─────────────────────────────");
    console.log("👑 ADMIN");
    console.log("   ID: admin");
    console.log("   Pass: password123");
    console.log("");
    console.log("👤 PATIENT");
    console.log("   ID: patient");
    console.log("   Pass: password123");
    console.log("");
    console.log("👨‍⚕️ DOCTOR");
    console.log("   ID: doctor");
    console.log("   Pass: password123");
    console.log("─────────────────────────────\n");

    // Show all users
    const allUsers = await userCollection.find({}).toArray();
    console.log(`📊 Total users in database: ${allUsers.length}`);
    console.log("\nAll users:");
    allUsers.forEach((u) => {
      console.log(`  • ${u.userId} (${u.role}) - ${u.email}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected");
  }
}

createTestUsers();
