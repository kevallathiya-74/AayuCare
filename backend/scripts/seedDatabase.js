/**
 * AayuCare Database Seed Script
 * Production-Ready Data Seeding with Repository Pattern
 * 
 * Purpose: Populate database with sample users (Patients, Doctors, Admins)
 * Usage: node scripts/seedDatabase.js
 * 
 * MANDATORY RULES (from PROJECT_RULES.md):
 * - Follow repository pattern
 * - Use transactions for atomic operations
 * - Proper validation and error handling
 * - Structured logging
 * - No hardcoded values
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, closePool } = require('../src/config/postgres');
const logger = require('../src/utils/logger');
const { withTransaction } = require('../src/utils/transaction');

// Common password for all seed users (hashed)
const COMMON_PASSWORD = 'password123';
const HOSPITAL_ID = 'MAIN';
const HOSPITAL_NAME = 'AayuCare Main Hospital';

/**
 * Seed Data Structure
 */
const SEED_DATA = {
  admins: [
    {
      userId: 'ADM001',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@aayucare.com',
      phone: '9876543210',
      role: 'admin'
    },
    {
      userId: 'ADM002',
      name: 'Priya Sharma',
      email: 'priya.sharma@aayucare.com',
      phone: '9876543211',
      role: 'admin'
    }
  ],
  
  doctors: [
    {
      userId: 'DOC001',
      name: 'Dr. Amit Patel',
      email: 'amit.patel@aayucare.com',
      phone: '9876543220',
      role: 'doctor',
      profile: {
        specialization: 'Cardiologist',
        qualification: 'MBBS, MD (Cardiology)',
        experience: 15,
        consultation_fee: 1000,
        license_number: 'MH/12345/2010',
        department: 'Cardiology',
        bio: 'Senior Cardiologist with 15 years of experience in treating heart diseases.',
        availability: {
          monday: ['09:00-12:00', '14:00-17:00'],
          tuesday: ['09:00-12:00', '14:00-17:00'],
          wednesday: ['09:00-12:00', '14:00-17:00'],
          thursday: ['09:00-12:00', '14:00-17:00'],
          friday: ['09:00-12:00', '14:00-17:00'],
          saturday: ['09:00-12:00']
        }
      }
    },
    {
      userId: 'DOC002',
      name: 'Dr. Sneha Desai',
      email: 'sneha.desai@aayucare.com',
      phone: '9876543221',
      role: 'doctor',
      profile: {
        specialization: 'Pediatrician',
        qualification: 'MBBS, MD (Pediatrics)',
        experience: 10,
        consultation_fee: 800,
        license_number: 'GJ/67890/2014',
        department: 'Pediatrics',
        bio: 'Experienced pediatrician specializing in child healthcare and development.',
        availability: {
          monday: ['10:00-13:00', '15:00-18:00'],
          tuesday: ['10:00-13:00', '15:00-18:00'],
          wednesday: ['10:00-13:00', '15:00-18:00'],
          thursday: ['10:00-13:00', '15:00-18:00'],
          friday: ['10:00-13:00', '15:00-18:00']
        }
      }
    },
    {
      userId: 'DOC003',
      name: 'Dr. Vikram Singh',
      email: 'vikram.singh@aayucare.com',
      phone: '9876543222',
      role: 'doctor',
      profile: {
        specialization: 'Orthopedic Surgeon',
        qualification: 'MBBS, MS (Orthopedics)',
        experience: 12,
        consultation_fee: 1200,
        license_number: 'DL/11223/2012',
        department: 'Orthopedics',
        bio: 'Specialist in bone and joint surgeries with extensive experience.',
        availability: {
          monday: ['08:00-11:00', '14:00-17:00'],
          wednesday: ['08:00-11:00', '14:00-17:00'],
          friday: ['08:00-11:00', '14:00-17:00'],
          saturday: ['08:00-12:00']
        }
      }
    },
    {
      userId: 'DOC004',
      name: 'Dr. Kavita Mehta',
      email: 'kavita.mehta@aayucare.com',
      phone: '9876543223',
      role: 'doctor',
      profile: {
        specialization: 'Dermatologist',
        qualification: 'MBBS, MD (Dermatology)',
        experience: 8,
        consultation_fee: 900,
        license_number: 'MH/33445/2016',
        department: 'Dermatology',
        bio: 'Expert in skin care and cosmetic dermatology.',
        availability: {
          tuesday: ['09:00-13:00', '15:00-18:00'],
          thursday: ['09:00-13:00', '15:00-18:00'],
          saturday: ['09:00-13:00']
        }
      }
    },
    {
      userId: 'DOC005',
      name: 'Dr. Arjun Reddy',
      email: 'arjun.reddy@aayucare.com',
      phone: '9876543224',
      role: 'doctor',
      profile: {
        specialization: 'General Physician',
        qualification: 'MBBS, MD (General Medicine)',
        experience: 20,
        consultation_fee: 700,
        license_number: 'AP/55667/2004',
        department: 'General Medicine',
        bio: 'Experienced general physician providing comprehensive healthcare.',
        availability: {
          monday: ['09:00-12:00', '14:00-17:00'],
          tuesday: ['09:00-12:00', '14:00-17:00'],
          wednesday: ['09:00-12:00', '14:00-17:00'],
          thursday: ['09:00-12:00', '14:00-17:00'],
          friday: ['09:00-12:00', '14:00-17:00'],
          saturday: ['09:00-13:00']
        }
      }
    }
  ],
  
  patients: [
    {
      userId: 'PAT001',
      name: 'Rahul Verma',
      email: 'rahul.verma@gmail.com',
      phone: '9876543230',
      role: 'patient',
      profile: {
        date_of_birth: '1990-05-15',
        gender: 'male',
        blood_group: 'O+',
        address: '123, MG Road, Mumbai, Maharashtra - 400001',
        emergency_contact_name: 'Sunita Verma',
        emergency_contact_phone: '9876543231',
        allergies: ['Penicillin'],
        chronic_conditions: []
      }
    },
    {
      userId: 'PAT002',
      name: 'Anjali Gupta',
      email: 'anjali.gupta@gmail.com',
      phone: '9876543232',
      role: 'patient',
      profile: {
        date_of_birth: '1985-08-22',
        gender: 'female',
        blood_group: 'A+',
        address: '456, Park Street, Kolkata, West Bengal - 700016',
        emergency_contact_name: 'Rajesh Gupta',
        emergency_contact_phone: '9876543233',
        allergies: [],
        chronic_conditions: ['Diabetes Type 2']
      }
    },
    {
      userId: 'PAT003',
      name: 'Sanjay Joshi',
      email: 'sanjay.joshi@gmail.com',
      phone: '9876543234',
      role: 'patient',
      profile: {
        date_of_birth: '1978-12-10',
        gender: 'male',
        blood_group: 'B+',
        address: '789, Ring Road, Ahmedabad, Gujarat - 380015',
        emergency_contact_name: 'Nisha Joshi',
        emergency_contact_phone: '9876543235',
        allergies: ['Sulfa drugs'],
        chronic_conditions: ['Hypertension']
      }
    },
    {
      userId: 'PAT004',
      name: 'Meera Nair',
      email: 'meera.nair@gmail.com',
      phone: '9876543236',
      role: 'patient',
      profile: {
        date_of_birth: '1995-03-18',
        gender: 'female',
        blood_group: 'AB+',
        address: '321, Beach Road, Chennai, Tamil Nadu - 600001',
        emergency_contact_name: 'Suresh Nair',
        emergency_contact_phone: '9876543237',
        allergies: [],
        chronic_conditions: []
      }
    },
    {
      userId: 'PAT005',
      name: 'Karan Malhotra',
      email: 'karan.malhotra@gmail.com',
      phone: '9876543238',
      role: 'patient',
      profile: {
        date_of_birth: '1988-07-25',
        gender: 'male',
        blood_group: 'O-',
        address: '654, Connaught Place, New Delhi - 110001',
        emergency_contact_name: 'Simran Malhotra',
        emergency_contact_phone: '9876543239',
        allergies: ['Peanuts'],
        chronic_conditions: ['Asthma']
      }
    },
    {
      userId: 'PAT006',
      name: 'Pooja Iyer',
      email: 'pooja.iyer@gmail.com',
      phone: '9876543240',
      role: 'patient',
      profile: {
        date_of_birth: '1992-11-30',
        gender: 'female',
        blood_group: 'A-',
        address: '987, Residency Road, Bangalore, Karnataka - 560025',
        emergency_contact_name: 'Ramesh Iyer',
        emergency_contact_phone: '9876543241',
        allergies: [],
        chronic_conditions: []
      }
    },
    {
      userId: 'PAT007',
      name: 'Arun Kumar',
      email: 'arun.kumar@gmail.com',
      phone: '9876543242',
      role: 'patient',
      profile: {
        date_of_birth: '1982-04-08',
        gender: 'male',
        blood_group: 'B-',
        address: '147, Banjara Hills, Hyderabad, Telangana - 500034',
        emergency_contact_name: 'Lakshmi Kumar',
        emergency_contact_phone: '9876543243',
        allergies: ['Latex'],
        chronic_conditions: []
      }
    },
    {
      userId: 'PAT008',
      name: 'Divya Shah',
      email: 'divya.shah@gmail.com',
      phone: '9876543244',
      role: 'patient',
      profile: {
        date_of_birth: '1998-09-12',
        gender: 'female',
        blood_group: 'O+',
        address: '258, Civil Lines, Jaipur, Rajasthan - 302006',
        emergency_contact_name: 'Ashok Shah',
        emergency_contact_phone: '9876543245',
        allergies: [],
        chronic_conditions: []
      }
    }
  ]
};

/**
 * Hash password using bcrypt (same as production)
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Create user in PostgreSQL users table
 */
async function createUser(client, userData, passwordHash) {
  const result = await client.query(
    `INSERT INTO users (
      id, user_id, name, email, phone, password_hash, 
      role, hospital_id, hospital_name, is_active, 
      email_verified, phone_verified, created_at, updated_at
    ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    RETURNING *`,
    [
      userData.userId,
      userData.name,
      userData.email,
      userData.phone,
      passwordHash,
      userData.role,
      HOSPITAL_ID,
      HOSPITAL_NAME,
      true,
      true,
      true
    ]
  );
  
  return result.rows[0];
}

/**
 * Create doctor profile
 */
async function createDoctorProfile(client, userId, profile) {
  const result = await client.query(
    `INSERT INTO doctors (
      id, user_id, specialization, qualification, experience,
      consultation_fee, license_number, department, bio, availability,
      created_at, updated_at
    ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *`,
    [
      userId,
      profile.specialization,
      profile.qualification,
      profile.experience,
      profile.consultation_fee,
      profile.license_number,
      profile.department,
      profile.bio,
      JSON.stringify(profile.availability)
    ]
  );
  
  return result.rows[0];
}

/**
 * Create patient profile
 */
async function createPatientProfile(client, userId, profile) {
  const result = await client.query(
    `INSERT INTO patients (
      id, user_id, date_of_birth, gender, blood_group, address,
      emergency_contact_name, emergency_contact_phone, allergies,
      chronic_conditions, created_at, updated_at
    ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *`,
    [
      userId,
      profile.date_of_birth || null,
      profile.gender || null,
      profile.blood_group || null,
      profile.address || null,
      profile.emergency_contact_name || null,
      profile.emergency_contact_phone || null,
      profile.allergies || [],
      profile.chronic_conditions || []
    ]
  );
  
  return result.rows[0];
}

/**
 * Check if user already exists
 */
async function userExists(email) {
  const result = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  return result.rows.length > 0;
}

/**
 * Seed all data
 */
async function seedDatabase() {
  logger.info('=====================================');
  logger.info('🌱 AayuCare Database Seeding Started');
  logger.info('=====================================');
  
  try {
    // Hash password once (same for all users)
    logger.info('🔐 Hashing common password...');
    const passwordHash = await hashPassword(COMMON_PASSWORD);
    logger.info('✅ Password hashed successfully');
    
    let stats = {
      admins: { created: 0, skipped: 0 },
      doctors: { created: 0, skipped: 0 },
      patients: { created: 0, skipped: 0 }
    };
    
    // Seed Admins
    logger.info('\n👤 Seeding Admins...');
    for (const admin of SEED_DATA.admins) {
      if (await userExists(admin.email)) {
        logger.warn(`⚠️  Admin already exists: ${admin.email}`);
        stats.admins.skipped++;
        continue;
      }
      
      await withTransaction(async (client) => {
        const user = await createUser(client, admin, passwordHash);
        logger.info(`✅ Created admin: ${user.name} (${user.email})`);
        stats.admins.created++;
      });
    }
    
    // Seed Doctors
    logger.info('\n👨‍⚕️ Seeding Doctors...');
    for (const doctor of SEED_DATA.doctors) {
      if (await userExists(doctor.email)) {
        logger.warn(`⚠️  Doctor already exists: ${doctor.email}`);
        stats.doctors.skipped++;
        continue;
      }
      
      await withTransaction(async (client) => {
        const user = await createUser(client, doctor, passwordHash);
        await createDoctorProfile(client, user.id, doctor.profile);
        logger.info(`✅ Created doctor: ${user.name} - ${doctor.profile.specialization} (${user.email})`);
        stats.doctors.created++;
      });
    }
    
    // Seed Patients
    logger.info('\n🩺 Seeding Patients...');
    for (const patient of SEED_DATA.patients) {
      if (await userExists(patient.email)) {
        logger.warn(`⚠️  Patient already exists: ${patient.email}`);
        stats.patients.skipped++;
        continue;
      }
      
      await withTransaction(async (client) => {
        const user = await createUser(client, patient, passwordHash);
        await createPatientProfile(client, user.id, patient.profile);
        logger.info(`✅ Created patient: ${user.name} (${user.email})`);
        stats.patients.created++;
      });
    }
    
    // Summary
    logger.info('\n=====================================');
    logger.info('✅ Database Seeding Completed');
    logger.info('=====================================');
    logger.info(`📊 Summary:`);
    logger.info(`   Admins:   ${stats.admins.created} created, ${stats.admins.skipped} skipped`);
    logger.info(`   Doctors:  ${stats.doctors.created} created, ${stats.doctors.skipped} skipped`);
    logger.info(`   Patients: ${stats.patients.created} created, ${stats.patients.skipped} skipped`);
    logger.info('');
    logger.info('🔐 Login Credentials:');
    logger.info('   Common Password: password123');
    logger.info('');
    logger.info('📧 Sample Logins:');
    logger.info('   Admin:   rajesh.kumar@aayucare.com');
    logger.info('   Doctor:  amit.patel@aayucare.com');
    logger.info('   Patient: rahul.verma@gmail.com');
    logger.info('=====================================');
    
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await closePool();
    logger.info('🔌 Database connection closed');
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('✅ Seeding process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
