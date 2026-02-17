/**
 * Mobile Login Diagnostic Script
 * Tests all endpoints that the mobile app uses during login
 */

// Use native fetch (Node.js 18+)
const fetch = global.fetch || require('node-fetch');

// Test configuration
const TEST_USERS = [
  {
    userId: 'ADM001',
    email: 'rajesh.kumar@aayucare.com',
    password: 'password123',
    role: 'admin'
  },
  {
    userId: 'DOC001',
    email: 'amit.patel@aayucare.com',
    password: 'password123',
    role: 'doctor'
  },
  {
    userId: 'PAT001',
    email: 'rahul.verma@gmail.com',
    password: 'password123',
    role: 'patient'
  }
];

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
let TEST_CREDENTIALS = TEST_USERS[0]; // Default to admin

// Check if specific user is requested via command line
const userArg = process.argv[2];
if (userArg) {
  const found = TEST_USERS.find(u => u.userId === userArg.toUpperCase() || u.role === userArg.toLowerCase());
  if (found) TEST_CREDENTIALS = found;
}

console.log('='.repeat(80));
console.log('MOBILE LOGIN DIAGNOSTIC TEST');
console.log('='.repeat(80));
console.log(`Backend URL: ${BASE_URL}`);
console.log(`Test User: ${TEST_CREDENTIALS.userId} (${TEST_CREDENTIALS.email})`);
console.log('='.repeat(80));
console.log('');

// Helper function to make requests
async function testEndpoint(name, url, options = {}) {
  console.log(`\n📍 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const duration = Date.now() - startTime;
    
    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   📦 Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, status: response.status, data, duration };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDiagnostics() {
  const results = {
    health: false,
    userIdToEmail: false,
    betterAuthSignIn: false,
    profileFetch: false,
    sessionFetch: false
  };

  console.log('STEP 1: Health Check');
  console.log('-'.repeat(80));
  const health = await testEndpoint(
    'Health Check',
    `${BASE_URL}/api/health`,
    { method: 'GET' }
  );
  results.health = health.success;

  console.log('\n\nSTEP 2: UserId → Email Conversion');
  console.log('-'.repeat(80));
  const emailLookup = await testEndpoint(
    'Email by UserId',
    `${BASE_URL}/api/user/email-by-userid`,
    {
      method: 'POST',
      body: JSON.stringify({ userId: TEST_CREDENTIALS.userId })
    }
  );
  results.userIdToEmail = emailLookup.success;
  
  const email = emailLookup.data?.email || emailLookup.data?.data?.email || TEST_CREDENTIALS.email;
  console.log(`   🔑 Extracted Email: ${email}`);

  console.log('\n\nSTEP 3: Better Auth Sign-In');
  console.log('-'.repeat(80));
  const authSignIn = await testEndpoint(
    'Better Auth Sign-In',
    `${BASE_URL}/api/auth/sign-in/email`,
    {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        password: TEST_CREDENTIALS.password
      })
    }
  );
  results.betterAuthSignIn = authSignIn.success;
  
  const betterAuthUser = authSignIn.data?.user;
  const betterAuthToken = authSignIn.data?.token;
  console.log(`   👤 User ID: ${betterAuthUser?.id}`);
  console.log(`   🎫 Token: ${betterAuthToken ? 'Present' : 'Missing'}`);

  console.log('\n\nSTEP 4: Profile Fetch');
  console.log('-'.repeat(80));
  const profile = await testEndpoint(
    'Profile by Email',
    `${BASE_URL}/api/user/profile-by-email`,
    {
      method: 'POST',
      body: JSON.stringify({ email: email })
    }
  );
  results.profileFetch = profile.success;
  
  if (profile.data?.data) {
    console.log(`   📇 User: ${profile.data.data.name}`);
    console.log(`   🏥 Role: ${profile.data.data.role}`);
    console.log(`   📧 Email: ${profile.data.data.email}`);
  }

  console.log('\n\nSTEP 5: Session Token Fetch');
  console.log('-'.repeat(80));
  if (betterAuthUser?.id) {
    const session = await testEndpoint(
      'Current Session',
      `${BASE_URL}/api/user/current-session`,
      {
        method: 'POST',
        body: JSON.stringify({ userId: betterAuthUser.id })
      }
    );
    results.sessionFetch = session.success;
    
    if (session.data?.token) {
      console.log(`   🎫 Session Token: ${session.data.token.substring(0, 20)}...`);
    }
  } else {
    console.log(`   ⏭️  Skipped (no Better Auth user ID)`);
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80));
  
  const allPassed = Object.values(results).every(r => r === true);
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test.padEnd(30)} ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log('='.repeat(80));
  
  if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED - Backend is working correctly!');
    console.log('\n🔍 If mobile app still fails, the issue is likely:');
    console.log('   1. Mobile app cannot reach the backend (network/firewall)');
    console.log('   2. Wrong API URL configured in mobile app');
    console.log('   3. Better Auth client configuration mismatch');
  } else {
    console.log('\n❌ SOME TESTS FAILED - Backend needs fixing');
    console.log('\n🔍 Check the failed steps above for details');
  }
  
  console.log('\n');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
