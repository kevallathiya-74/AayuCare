/**
 * Better Auth Performance Optimization Script
 * Creates indexes for faster queries
 */

require("dotenv").config();
const mongoose = require("mongoose");

async function optimizeIndexes() {
  try {
    console.log("🚀 Starting Better Auth index optimization...\n");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // Create indexes for user collection
    console.log("📊 Creating indexes for user collection...");
    await db.collection("user").createIndex({ email: 1 }, { unique: true });
    console.log("   ✅ Email index created (unique)");

    await db.collection("user").createIndex({ userId: 1 }, { sparse: true });
    console.log("   ✅ userId index created");

    await db.collection("user").createIndex({ hospitalId: 1, role: 1 });
    console.log("   ✅ hospitalId + role compound index created");

    // Create indexes for account collection
    console.log("\n📊 Creating indexes for account collection...");
    await db.collection("account").createIndex({ userId: 1 });
    console.log("   ✅ userId index created");

    await db
      .collection("account")
      .createIndex({ accountId: 1, providerId: 1 }, { unique: true });
    console.log("   ✅ accountId + providerId compound index created (unique)");

    // Create indexes for session collection
    console.log("\n📊 Creating indexes for session collection...");
    await db.collection("session").createIndex({ token: 1 }, { unique: true });
    console.log("   ✅ token index created (unique)");

    await db.collection("session").createIndex({ userId: 1 });
    console.log("   ✅ userId index created");

    await db
      .collection("session")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log("   ✅ TTL index on expiresAt created (auto-cleanup)");

    console.log("\n" + "=".repeat(60));
    console.log("✨ INDEX OPTIMIZATION COMPLETE");
    console.log("=".repeat(60));

    // Verify indexes
    console.log("\n📋 Verifying indexes...\n");

    const userIndexes = await db.collection("user").indexes();
    console.log(`user collection: ${userIndexes.length} indexes`);
    userIndexes.forEach((idx) => console.log(`   - ${idx.name}`));

    const accountIndexes = await db.collection("account").indexes();
    console.log(`\naccount collection: ${accountIndexes.length} indexes`);
    accountIndexes.forEach((idx) => console.log(`   - ${idx.name}`));

    const sessionIndexes = await db.collection("session").indexes();
    console.log(`\nsession collection: ${sessionIndexes.length} indexes`);
    sessionIndexes.forEach((idx) => console.log(`   - ${idx.name}`));

    console.log("\n💡 PERFORMANCE IMPROVEMENTS:");
    console.log("   ✅ Email lookups: O(log n) instead of O(n)");
    console.log("   ✅ Session validation: O(log n) instead of O(n)");
    console.log("   ✅ Role-based queries: Compound index optimized");
    console.log("   ✅ Expired sessions: Auto-cleanup with TTL");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Database connection closed\n");
  }
}

optimizeIndexes()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
