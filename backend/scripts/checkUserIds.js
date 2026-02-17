/**
 * Check userId values in PostgreSQL users table
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

async function checkUserIds() {
  try {
    console.log('Checking userId values in PostgreSQL users table...\n');
    
    const result = await pool.query(`
      SELECT id, user_id, email, name, role 
      FROM users 
      ORDER BY role, email
      LIMIT 20
    `);
    
    console.log(`Found ${result.rows.length} users:\n`);
    console.log('ID (UUID) | user_id | Email | Name | Role');
    console.log('='.repeat(100));
    
    result.rows.forEach(row => {
      const userId = row.user_id || '(null)';
      console.log(`${row.id.substring(0, 8)}... | ${userId} | ${row.email} | ${row.name} | ${row.role}`);
    });
    
    console.log('\n' + '='.repeat(100));
    console.log('\n🔍 Checking for specific test users...\n');
    
    const testEmails = [
      'rajesh.kumar@aayucare.com',
      'amit.patel@aayucare.com',
      'rahul.verma@gmail.com'
    ];
    
    for (const email of testEmails) {
      const user = await pool.query('SELECT id, user_id, email, role FROM users WHERE email = $1', [email]);
      if (user.rows.length > 0) {
        const u = user.rows[0];
        console.log(`✅ ${email}`);
        console.log(`   UUID: ${u.id}`);
        console.log(`   user_id: ${u.user_id || '(null)'}`);
        console.log(`   role: ${u.role}`);
        console.log('');
      } else {
        console.log(`❌ ${email} - NOT FOUND`);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserIds();
