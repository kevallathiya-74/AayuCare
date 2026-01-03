/**
 * Database Migration Script
 * Adds hospitalId to existing users and other collections
 * Run this ONCE after updating the User model
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');
const MedicalRecord = require('../src/models/MedicalRecord');
const Prescription = require('../src/models/Prescription');
const Event = require('../src/models/Event');
const HealthMetric = require('../src/models/HealthMetric');

const DEFAULT_HOSPITAL = {
    id: 'HSP001',
    name: 'AayuCare Main Hospital'
};

async function migrateDatabase() {
    try {
        console.log('========================================');
        console.log('AayuCare Database Migration');
        console.log('========================================\n');

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Update Users
        console.log('1. Migrating User collection...');
        const usersResult = await User.updateMany(
            { hospitalId: { $exists: false } },
            { 
                $set: { 
                    hospitalId: DEFAULT_HOSPITAL.id,
                    hospitalName: DEFAULT_HOSPITAL.name
                } 
            }
        );
        console.log(`✅ Updated ${usersResult.modifiedCount} users with hospitalId\n`);

        // 2. Update Events
        console.log('2. Migrating Event collection...');
        const eventsResult = await Event.updateMany(
            { hospitalId: { $exists: false } },
            { $set: { hospitalId: DEFAULT_HOSPITAL.id } }
        );
        console.log(`✅ Updated ${eventsResult.modifiedCount} events with hospitalId\n`);

        // 3. Update HealthMetrics
        console.log('3. Migrating HealthMetric collection...');
        const metricsResult = await HealthMetric.updateMany(
            { hospitalId: { $exists: false } },
            { $set: { hospitalId: DEFAULT_HOSPITAL.id } }
        );
        console.log(`✅ Updated ${metricsResult.modifiedCount} health metrics with hospitalId\n`);

        // 4. Verify Appointments (should already have hospitalId)
        console.log('4. Checking Appointment collection...');
        const appointmentsWithoutHospital = await Appointment.countDocuments({ 
            hospitalId: { $exists: false } 
        });
        if (appointmentsWithoutHospital > 0) {
            console.log(`⚠️  Found ${appointmentsWithoutHospital} appointments without hospitalId`);
            console.log('   These should be rare. Updating...');
            await Appointment.updateMany(
                { hospitalId: { $exists: false } },
                { $set: { hospitalId: DEFAULT_HOSPITAL.id } }
            );
            console.log('✅ Fixed\n');
        } else {
            console.log('✅ All appointments have hospitalId\n');
        }

        // 5. Verify MedicalRecords
        console.log('5. Checking MedicalRecord collection...');
        const recordsWithoutHospital = await MedicalRecord.countDocuments({ 
            hospitalId: { $exists: false } 
        });
        if (recordsWithoutHospital > 0) {
            console.log(`⚠️  Found ${recordsWithoutHospital} medical records without hospitalId`);
            await MedicalRecord.updateMany(
                { hospitalId: { $exists: false } },
                { $set: { hospitalId: DEFAULT_HOSPITAL.id } }
            );
            console.log('✅ Fixed\n');
        } else {
            console.log('✅ All medical records have hospitalId\n');
        }

        // 6. Verify Prescriptions
        console.log('6. Checking Prescription collection...');
        const prescriptionsWithoutHospital = await Prescription.countDocuments({ 
            hospitalId: { $exists: false } 
        });
        if (prescriptionsWithoutHospital > 0) {
            console.log(`⚠️  Found ${prescriptionsWithoutHospital} prescriptions without hospitalId`);
            await Prescription.updateMany(
                { hospitalId: { $exists: false } },
                { $set: { hospitalId: DEFAULT_HOSPITAL.id } }
            );
            console.log('✅ Fixed\n');
        } else {
            console.log('✅ All prescriptions have hospitalId\n');
        }

        // Summary
        console.log('========================================');
        console.log('Migration Summary:');
        console.log('========================================');
        console.log(`Users updated: ${usersResult.modifiedCount}`);
        console.log(`Events updated: ${eventsResult.modifiedCount}`);
        console.log(`Health Metrics updated: ${metricsResult.modifiedCount}`);
        console.log(`Default Hospital: ${DEFAULT_HOSPITAL.id} - ${DEFAULT_HOSPITAL.name}`);
        console.log('\n✅ Migration completed successfully!');
        console.log('========================================\n');

        // Create indexes
        console.log('Creating indexes...');
        await User.createIndexes();
        await Appointment.createIndexes();
        await MedicalRecord.createIndexes();
        await Prescription.createIndexes();
        await Event.createIndexes();
        await HealthMetric.createIndexes();
        console.log('✅ Indexes created\n');

        // Verification
        console.log('========================================');
        console.log('Verification:');
        console.log('========================================');
        const totalUsers = await User.countDocuments({});
        const usersWithHospitalId = await User.countDocuments({ hospitalId: { $exists: true } });
        console.log(`Total Users: ${totalUsers}`);
        console.log(`Users with hospitalId: ${usersWithHospitalId}`);
        
        if (totalUsers === usersWithHospitalId) {
            console.log('✅ All users have hospitalId');
        } else {
            console.log('⚠️  Some users missing hospitalId');
        }
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);
    }
}

// Run migration
if (require.main === module) {
    console.log('\n🚀 Starting database migration...\n');
    
    // Confirm before running
    console.log('⚠️  WARNING: This will modify your database!');
    console.log('   Database:', process.env.MONGODB_URI?.split('@')[1]?.split('?')[0] || 'Unknown');
    console.log('   Default Hospital ID:', DEFAULT_HOSPITAL.id);
    console.log('   Default Hospital Name:', DEFAULT_HOSPITAL.name);
    console.log('\nPress Ctrl+C to cancel or wait 3 seconds to continue...\n');
    
    setTimeout(() => {
        migrateDatabase();
    }, 3000);
}

module.exports = migrateDatabase;
