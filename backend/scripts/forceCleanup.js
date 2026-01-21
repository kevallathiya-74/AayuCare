/**
 * Force Delete Duplicate and Empty Collections
 * Permanently removes all unnecessary collections from MongoDB Atlas
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

async function forceCleanup() {
  try {
    console.log("🔗 Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    const db = mongoose.connection.db;

    // Collections to PERMANENTLY DELETE
    const toDelete = [
      "users", // Old schema - duplicate of "user"
      "events", // Empty
      "healthmetrics", // Empty
      "medicalrecords", // Empty
      "notifications", // Empty
      "prescriptions", // Empty
      "schedules", // Empty
    ];

    console.log("🗑️  Deleting collections:\n");

    for (const collName of toDelete) {
      try {
        // Check if exists
        const collections = await db
          .listCollections({ name: collName })
          .toArray();

        if (collections.length > 0) {
          const count = await db.collection(collName).countDocuments();
          await db.dropCollection(collName);
          console.log(`✅ DELETED: ${collName} (${count} documents)`);
        } else {
          console.log(`⚠️  ${collName} - already deleted`);
        }
      } catch (error) {
        console.error(`❌ Error with ${collName}:`, error.message);
      }
    }

    console.log("\n✅ CLEANUP COMPLETE!\n");

    console.log("📊 Remaining collections:");
    const finalCollections = await db.listCollections().toArray();
    for (const coll of finalCollections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  ✅ ${coll.name} (${count} documents)`);
    }

    console.log("\n🎉 Your database is now clean!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected");
  }
}

forceCleanup();
