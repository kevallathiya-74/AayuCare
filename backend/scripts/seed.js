/**
 * Database Seeder
 * Creates test users for Admin, Doctor, and Patient roles
 */

const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const testUsers = [
    // Admin User
    {
        userId: 'ADM001',
        name: 'Admin User',
        email: 'admin@aayucare.com',
        phone: '+919876543210',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
    },
    // Doctor User
    {
        userId: 'DOC001',
        name: 'Dr. Rajesh Kumar',
        email: 'doctor@aayucare.com',
        phone: '+919876543211',
        password: 'doctor123',
        role: 'doctor',
        specialization: 'Cardiology',
        qualification: 'MBBS, MD (Cardiology)',
        experience: 10,
        consultationFee: 500,
    },
    // Patient User
    {
        userId: 'PAT001',
        name: 'Amit Patel',
        email: 'patient@aayucare.com',
        phone: '+919876543212',
        password: 'patient123',
        role: 'patient',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        bloodGroup: 'O+',
        address: 'Mumbai, Maharashtra, India',
    },
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing test users
        await User.deleteMany({ userId: { $in: ['ADM001', 'DOC001', 'PAT001'] } });
        console.log('🗑️  Cleared existing test users');

        // Create new users with hashed passwords
        for (const userData of testUsers) {
            const user = await User.create(userData);
            console.log(`✅ Created ${user.role.toUpperCase()}: ${user.userId} - ${user.name}`);
        }

        console.log('\n🎉 Database seeding completed!');
        console.log('\n📋 Test Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ADMIN:');
        console.log('  User ID:  ADM001');
        console.log('  Password: admin123');
        console.log('  Email:    admin@aayucare.com');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('DOCTOR:');
        console.log('  User ID:  DOC001');
        console.log('  Password: doctor123');
        console.log('  Email:    doctor@aayucare.com');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('PATIENT:');
        console.log('  User ID:  PAT001');
        console.log('  Password: patient123');
        console.log('  Email:    patient@aayucare.com');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('✅ Passwords are securely hashed in MongoDB');
        console.log('✅ You can now login with these credentials\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
