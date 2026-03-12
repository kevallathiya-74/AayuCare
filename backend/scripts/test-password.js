const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Get Rajesh Kumar's password hash from account table
    const result = await pool.query(
      `SELECT a.password, u.email, u.name 
       FROM account a 
       JOIN users u ON a.user_id = u.id 
       WHERE u.email = $1`,
      ['rajesh.kumar@aayucare.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ No account found for rajesh.kumar@aayucare.com');
      process.exit(1);
    }

    const { password: hash, email, name } = result.rows[0];
    console.log('✓ Found account:', { name, email });
    console.log('✓ Password hash exists:', hash ? 'YES' : 'NO');
    console.log('✓ Hash prefix:', hash ? hash.substring(0, 7) : 'N/A');

    // Test password verification
    const testPassword = 'password123';
    console.log('\nTesting password:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, hash);
    
    if (isValid) {
      console.log('✅ PASSWORD VERIFICATION SUCCESS!');
      console.log('The password "password123" matches the stored hash.');
    } else {
      console.log('❌ PASSWORD VERIFICATION FAILED!');
      console.log('The password "password123" does NOT match the stored hash.');
      
      // Try to see what the hash actually is for
      console.log('\nDebugging info:');
      console.log('- Hash length:', hash.length);
      console.log('- Hash type:', hash.startsWith('$2b$') ? 'bcrypt' : 'unknown');
      console.log('- bcrypt rounds:', hash.startsWith('$2b$') ? hash.substring(4, 6) : 'N/A');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testPassword();
