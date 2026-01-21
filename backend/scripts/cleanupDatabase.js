/**
 * Database Cleanup Script
 * - Removes duplicate "users" collection (old schema)
 * - Removes empty collections (events, healthmetrics, medicalrecords, notifications, prescriptions, schedules)
 * - Keeps Better Auth collections (user, account, session)
 * - Keeps appointments collection (has data)
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanupDatabase() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // Collections to delete
    const collectionsToDelete = [
      "users", // Old schema - duplicate data exists in "user" collection
      "events", // Empty
      "healthmetrics", // Empty
      "medicalrecords", // Empty
      "notifications", // Empty
      "prescriptions", // Empty
      "schedules", // Empty
    ];

    console.log("📋 Collections to keep:");
    console.log("  ✅ user (Better Auth users - 5 docs)");
    console.log("  ✅ account (Better Auth credentials - 5 docs)");
    console.log("  ✅ session (Better Auth sessions - 11 docs)");
    console.log("  ✅ appointments (has 1 appointment)\n");

    console.log("🗑️  Collections to DELETE:");
    for (const collectionName of collectionsToDelete) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`  ❌ ${collectionName} (${count} docs)`);
    }

    console.log(
      "\n⚠️  WARNING: This will permanently delete the above collections!"
    );
    console.log("Press Ctrl+C to cancel or wait 5 seconds to continue...\n");

    // Wait 5 seconds before deleting
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("🔄 Starting cleanup...\n");

    for (const collectionName of collectionsToDelete) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();

        if (count > 0 || collectionName === "users") {
          await collection.drop();
          console.log(
            `✅ Deleted collection: ${collectionName} (${count} docs)`
          );
        } else {
          console.log(`⚠️  Skipped: ${collectionName} (already empty)`);
        }
      } catch (error) {
        if (error.codeName === "NamespaceNotFound") {
          console.log(`⚠️  Collection ${collectionName} does not exist`);
        } else {
          console.error(`❌ Error deleting ${collectionName}:`, error.message);
        }
      }
    }

    console.log("\n✅ Database cleanup complete!");
    console.log("\n📊 Remaining collections:");

    const collections = await db.listCollections().toArray();
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  ✅ ${coll.name} (${count} docs)`);
    }

    console.log("\n🎉 Done! Database is now clean and optimized.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

cleanupDatabase();
