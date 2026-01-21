/**
 * Remove Empty Collections
 * Forces deletion of empty collections that were skipped
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

async function removeEmptyCollections() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    const emptyCollections = [
      "events",
      "healthmetrics",
      "medicalrecords",
      "notifications",
      "prescriptions",
      "schedules",
    ];

    console.log("🗑️  Removing empty collections...\n");

    for (const collectionName of emptyCollections) {
      try {
        await db.collection(collectionName).drop();
        console.log(`✅ Deleted: ${collectionName}`);
      } catch (error) {
        if (error.codeName === "NamespaceNotFound") {
          console.log(`⚠️  ${collectionName} already deleted`);
        } else {
          console.error(`❌ Error deleting ${collectionName}:`, error.message);
        }
      }
    }

    console.log("\n📊 Final collection list:");
    const collections = await db.listCollections().toArray();
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  ✅ ${coll.name} (${count} documents)`);
    }

    console.log("\n✅ Cleanup complete!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

removeEmptyCollections();
