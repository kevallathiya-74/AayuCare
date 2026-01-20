/**
 * Reset User Passwords in MongoDB
 * Updates password hashes to match Better Auth format
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function resetPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.getClient().db("test");
    const userCollection = db.collection("user");
    const accountCollection = db.collection("account");

    const users = [
      { email: "testdoctor2@example.com", password: "password123" },
      { email: "testpatient2@example.com", password: "password123" },
      { email: "test@example.com", password: "password123" },
    ];

    for (const userData of users) {
      console.log(`🔄 Resetting password for: ${userData.email}`);

      // Find user
      const user = await userCollection.findOne({ email: userData.email });
      if (!user) {
        console.log(`❌ User not found: ${userData.email}\n`);
        continue;
      }

      // Hash password using bcrypt (same as Better Auth config)
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Update account password
      const result = await accountCollection.updateOne(
        { userId: user._id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Password updated for: ${userData.email}`);
      } else {
        console.log(`⚠️  No account found for: ${userData.email}`);
      }
      console.log("---");
    }

    console.log("\n✅ Password reset complete!");
    console.log("\nYou can now login with:");
    console.log("Email: testdoctor2@example.com / password123");
    console.log("Email: testpatient2@example.com / password123");
    console.log("Email: test@example.com / password123");
    console.log("\nOr use User IDs:");
    console.log("TESTDOC002 / password123");
    console.log("TESTPAT124 / password123");
    console.log("TESTUSR001 / password123");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

resetPasswords();
