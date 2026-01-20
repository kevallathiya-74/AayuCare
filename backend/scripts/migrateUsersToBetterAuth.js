/**
 * Migration Script: Migrate users from old "users" collection to Better Auth
 *
 * This script:
 * 1. Reads all users from the old "users" collection
 * 2. Creates entries in Better Auth's "user" collection
 * 3. Creates corresponding entries in Better Auth's "account" collection
 * 4. Handles password migration (bcrypt -> Better Auth format)
 *
 * Usage: node scripts/migrateUsersToBetterAuth.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");

// Better Auth uses PBKDF2 with SHA-256 for password hashing
const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = "sha256";

/**
 * Hash password using Better Auth's format (PBKDF2)
 * Note: Since old passwords are bcrypt hashed, we can't recover the original password.
 * Options:
 * 1. Force password reset for all users (set a temporary password)
 * 2. Keep the bcrypt hash and require users to reset password on first login
 *
 * For this migration, we'll use Option 1: set a temporary password that users must change
 */
function hashPasswordForBetterAuth(password) {
  // Generate a random salt (16 bytes = 32 hex characters)
  const salt = crypto.randomBytes(16).toString("hex");

  // Hash the password with PBKDF2
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");

  // Better Auth format: salt:hash
  return `${salt}:${hash}`;
}

/**
 * Generate a temporary password for migrated users
 */
function generateTemporaryPassword() {
  // Generate a secure temporary password
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Main migration function
 */
async function migrateUsers() {
  try {
    console.log("🚀 Starting user migration to Better Auth...\n");

    // Validate MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // Collections
    const oldUsersCollection = db.collection("users");
    const newUserCollection = db.collection("user");
    const accountCollection = db.collection("account");

    // Get all users from old collection
    console.log('📖 Reading users from old "users" collection...');
    const oldUsers = await oldUsersCollection.find({}).toArray();
    console.log(`Found ${oldUsers.length} users to migrate\n`);

    if (oldUsers.length === 0) {
      console.log("⚠️  No users found to migrate");
      await mongoose.connection.close();
      return;
    }

    // Track migration results
    const results = {
      total: oldUsers.length,
      successful: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // Store temporary passwords for display
    const temporaryPasswords = [];

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

        // Generate temporary password (since we can't decrypt bcrypt)
        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = hashPasswordForBetterAuth(temporaryPassword);

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
        };

        // Insert into user collection
        const userResult = await newUserCollection.insertOne(newUserData);
        const newUserId = userResult.insertedId;

        console.log(`   ✅ Created user record (ID: ${newUserId})`);

        // Create account entry for credential provider
        const accountData = {
          accountId: newUserId.toString(), // Better Auth uses string representation
          providerId: "credential",
          userId: newUserId,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await accountCollection.insertOne(accountData);
        console.log(`   ✅ Created account record`);

        // Store temporary password info
        temporaryPasswords.push({
          email: oldUser.email,
          name: oldUser.name,
          role: oldUser.role,
          temporaryPassword,
        });

        results.successful++;
        console.log(`   ✨ Migration successful for ${oldUser.email}`);
      } catch (error) {
        console.error(
          `   ❌ Failed to migrate ${oldUser.email}:`,
          error.message
        );
        results.failed++;
        results.errors.push({
          email: oldUser.email,
          error: error.message,
        });
      }
    }

    // Display migration summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total users:      ${results.total}`);
    console.log(`✅ Successful:    ${results.successful}`);
    console.log(`⏭️  Skipped:       ${results.skipped}`);
    console.log(`❌ Failed:        ${results.failed}`);
    console.log("=".repeat(60));

    // Display temporary passwords
    if (temporaryPasswords.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("🔑 TEMPORARY PASSWORDS (SAVE THESE!)");
      console.log("=".repeat(60));
      console.log(
        "⚠️  IMPORTANT: Users must change these passwords on first login\n"
      );

      temporaryPasswords.forEach((user) => {
        console.log(`Email:    ${user.email}`);
        console.log(`Name:     ${user.name}`);
        console.log(`Role:     ${user.role}`);
        console.log(`Password: ${user.temporaryPassword}`);
        console.log("-".repeat(60));
      });

      console.log("\n💡 TIP: Send password reset emails to these users");
      console.log('   or implement a "force password change" on first login');
    }

    // Display errors if any
    if (results.errors.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("⚠️  ERRORS ENCOUNTERED");
      console.log("=".repeat(60));
      results.errors.forEach((err) => {
        console.log(`Email: ${err.email}`);
        console.log(`Error: ${err.error}\n`);
      });
    }

    console.log("\n✨ Migration completed!");
    console.log("\n📝 NEXT STEPS:");
    console.log("   1. Notify users about password reset requirement");
    console.log(
      "   2. Verify migrated users can login with temporary passwords"
    );
    console.log("   3. Implement force password change on first login");
    console.log(
      '   4. Consider archiving/backing up the old "users" collection'
    );
    console.log(
      '   5. DO NOT delete old "users" collection until fully tested\n'
    );

    // Close connection
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error("Stack trace:", error.stack);

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateUsers, hashPasswordForBetterAuth };
