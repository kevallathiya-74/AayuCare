/**
 * Test Login Flow End-to-End
 * Tests the complete login process from userId to redirect
 */

const fetch = require("node-fetch");
const API_BASE = "https://aayucare-backend.onrender.com/api";

async function testLoginFlow() {
  console.log("🧪 Testing AayuCare Login Flow\n");

  // Test 1: Get email by userId
  console.log("1️⃣ Testing email lookup by userId...");
  try {
    const response = await fetch(`${API_BASE}/user/email-by-userid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "TESTDOC002" }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Email lookup successful:", data.email);
    } else {
      const error = await response.text();
      console.log("❌ Email lookup failed:", response.status, error);
    }
  } catch (err) {
    console.log("❌ Email lookup error:", err.message);
  }

  console.log("\n2️⃣ Testing Better Auth login endpoint...");
  try {
    const response = await fetch(
      `${API_BASE.replace("/api", "")}/api/auth/sign-in/email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "testdoctor2@example.com",
          password: "password123",
        }),
      }
    );

    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (response.ok && data.user) {
      console.log("✅ Login successful!");
      console.log("User:", data.user.name, "-", data.user.role);
      console.log("Session token:", data.session?.token ? "exists" : "missing");
    } else {
      console.log("❌ Login failed");
    }
  } catch (err) {
    console.log("❌ Login error:", err.message);
  }

  console.log("\n3️⃣ Available test users:");
  console.log("- TESTDOC002 / testdoctor2@example.com (doctor)");
  console.log("- TESTPAT124 / testpatient2@example.com (patient)");
  console.log("- TESTUSR001 / test@example.com (patient)");
}

testLoginFlow();
