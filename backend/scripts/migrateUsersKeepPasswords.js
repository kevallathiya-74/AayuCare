/**
 * Migration Script: Migrate users from old "users" collection to Better Auth
 * Version 2: Keeps original bcrypt passwords (requires Better Auth configured with bcrypt)
 *
 * This script:
 * 1. Reads all users from the old "users" collection
 * 2. Creates entries in Better Auth's "user" collection
 * 3. Creates corresponding entries in Better Auth's "account" collection
 * 4. KEEPS original bcrypt password hashes - users can login with existing passwords!
 *
 * Prerequisites: Better Auth must be configured with bcrypt (see src/lib/auth.js)
 * Usage: node scripts/migrateUsersKeepPasswords.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

/**
 * Main migration function
 */
async function migrateUsers() {
  try {
    console.log(
      "🚀 Starting user migration to Better Auth (keeping passwords)...\n"
    );

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;
    const oldUserCollection = db.collection("users");
    const newUserCollection = db.collection("user");
    const accountCollection = db.collection("account");

    // Read all users from old collection
    console.log('📖 Reading users from old "users" collection...');
    const oldUsers = await oldUserCollection.find({}).toArray();
    console.log(`Found ${oldUsers.length} users to migrate\n`);

    // Migration statistics
    const results = {
      total: oldUsers.length,
      successful: 0,
      skipped: 0,
      failed: 0,
    };

    // Migrate each user
    for (const oldUser of oldUsers) {
      try {
        console.log(`\n👤 Migrating user: ${oldUser.email} (${oldUser.name})`);

        // Check if user already exists in new collection (by email)
        const existingUser = await newUserCollection.findOne({
          email: oldUser.email,
        });

        if (existingUser) {
          console.log(
            `   ⏭️  User already exists in new collection (skipping)`
          );
          results.skipped++;
          continue;
        }

        // Prepare user data for Better Auth's user collection
        const newUserData = {
          name: oldUser.name,
          email: oldUser.email,
          emailVerified: oldUser.isVerified || false,
          createdAt: oldUser.createdAt || new Date(),
          updatedAt: new Date(),

          // Additional fields from Better Auth config
          userId: oldUser.userId,
          role: oldUser.role,
          hospitalId: oldUser.hospitalId,
          hospitalName: oldUser.hospitalName,
          phone: oldUser.phone,
          dateOfBirth: oldUser.dateOfBirth,
          gender: oldUser.gender,
          isActive: oldUser.isActive !== false, // Default to true if not specified
          isVerified: oldUser.isVerified || false,

          // Doctor-specific fields
          ...(oldUser.role === "doctor" && {
            specialization: oldUser.specialization,
            qualification: oldUser.qualification,
            experience: oldUser.experience,
            consultationFee: oldUser.consultationFee,
          }),

          // Admin-specific fields
          ...(oldUser.role === "admin" && {
            department: oldUser.department,
          }),

          // Patient-specific fields
          ...(oldUser.role === "patient" && {
            address: oldUser.address,
            avatar: oldUser.avatar,
            bloodGroup: oldUser.bloodGroup,
          }),
        };

        // Insert user into Better Auth's user collection
        const insertedUser = await newUserCollection.insertOne(newUserData);
        const newUserId = insertedUser.insertedId;
        console.log(`   ✅ Created user record (ID: ${newUserId})`);

        // Create account entry for Better Auth (KEEPING ORIGINAL BCRYPT PASSWORD)
        const accountData = {
          userId: newUserId,
          accountId: newUserId.toString(), // Better Auth uses userId as accountId for credentials
          providerId: "credential",
          password: oldUser.password, // KEEP ORIGINAL BCRYPT HASH
          createdAt: oldUser.createdAt || new Date(),
          updatedAt: new Date(),
        };

        await accountCollection.insertOne(accountData);
        console.log(`   ✅ Created account record with original password`);
        console.log(`   ✨ Migration successful for ${oldUser.email}`);

        results.successful++;
      } catch (userError) {
        console.error(
          `   ❌ Error migrating user ${oldUser.email}:`,
          userError.message
        );
        results.failed++;
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total users:      ${results.total}`);
    console.log(`✅ Successful:    ${results.successful}`);
    console.log(`⏭️  Skipped:       ${results.skipped}`);
    console.log(`❌ Failed:        ${results.failed}`);
    console.log("=".repeat(60) + "\n");

    if (results.successful > 0) {
      console.log("✅ Users migrated with ORIGINAL PASSWORDS preserved!");
      console.log("   Users can login with their existing passwords.\n");
    }

    console.log("📝 NEXT STEPS:");
    console.log("   1. Test login with migrated users");
    console.log("   2. Verify all user fields migrated correctly");
    console.log("   3. Test protected routes with migrated users");
    console.log(
      '   4. Keep old "users" collection as backup until fully tested'
    );
    console.log(
      "   5. Once confirmed working, consider archiving old collection\n"
    );
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log("👋 Database connection closed\n");
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
