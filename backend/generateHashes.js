/**
 * Generate Password Hashes for Manual MongoDB Insert
 * Run this to get properly hashed passwords
 *
 * Usage: node generateHashes.js
 */

const bcrypt = require("bcryptjs");

const users = [
  { userId: "ADMIN", name: "Rajesh Kumar", password: "password123" },
  { userId: "DOCTOR", name: "Dr. Priya Sharma", password: "password123" },
  { userId: "PATIENT", name: "Amit Patel", password: "password123" },
];

async function generateHashes() {
  console.log("🔐 Generating Password Hashes...\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 12);
    console.log(`${user.userId} (${user.name}):`);
    console.log(`Password: ${user.password}`);
    console.log(`Hash: ${hash}\n`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("✅ Copy these hashes to manualInsert.js or MongoDB Compass");
}

generateHashes();
