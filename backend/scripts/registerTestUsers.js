/**
 * Register Test Users via Better Auth API
 * Run this to create users with proper Better Auth password hashing
 */

const testUsers = [
  {
    email: "testdoctor2@example.com",
    password: "password123",
    name: "Dr. Test Doctor",
    userId: "TESTDOC002",
    role: "doctor",
    hospitalId: "HOSP001",
    hospitalName: "City Hospital",
    phone: "9876543298",
    specialization: "Cardiology",
    qualification: "MBBS, MD",
    experience: 10,
    consultationFee: 800,
  },
  {
    email: "testpatient2@example.com",
    password: "password123",
    name: "Test Patient",
    userId: "TESTPAT124",
    role: "patient",
    hospitalId: "HOSP001",
    hospitalName: "City Hospital",
    phone: "9876543299",
  },
  {
    email: "test@example.com",
    password: "password123",
    name: "Test User",
    userId: "TESTUSR001",
    role: "patient",
    hospitalId: "HOSP001",
    hospitalName: "City Hospital",
    phone: "9876543297",
  },
];

async function registerUsers() {
  const API_BASE = "https://aayucare-backend.onrender.com";

  console.log("🔄 Registering users via Better Auth API...\n");

  for (const user of testUsers) {
    try {
      console.log(`Registering: ${user.email} (${user.userId})`);

      const response = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://aayucare-app.com",
        },
        body: JSON.stringify(user),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${user.userId} registered successfully`);
      } else {
        console.log(
          `❌ ${user.userId} failed:`,
          data.error?.message || data.message || "Unknown error"
        );
      }
    } catch (error) {
      console.log(`❌ ${user.userId} error:`, error.message);
    }

    console.log("---");
  }

  console.log("\n✅ Registration complete!");
  console.log("\nYou can now login with:");
  console.log("- TESTDOC002 / password123");
  console.log("- TESTPAT124 / password123");
  console.log("- TESTUSR001 / password123");
}

registerUsers();
