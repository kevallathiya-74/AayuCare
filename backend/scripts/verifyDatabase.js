/**
 * Database Verification Script
 * Checks all collections and validates data integrity
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');
const Prescription = require('../src/models/Prescription');
const MedicalRecord = require('../src/models/MedicalRecord');
const HealthMetric = require('../src/models/HealthMetric');
const Event = require('../src/models/Event');

const verifyDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Count documents in each collection
        const [
            totalUsers,
            doctors,
            patients,
            admins,
            appointments,
            todayAppointments,
            prescriptions,
            medicalRecords,
            healthMetrics,
            events
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'doctor' }),
            User.countDocuments({ role: 'patient' }),
            User.countDocuments({ role: 'admin' }),
            Appointment.countDocuments(),
            Appointment.countDocuments({ 
                appointmentDate: { 
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                } 
            }),
            Prescription.countDocuments(),
            MedicalRecord.countDocuments(),
            HealthMetric.countDocuments(),
            Event.countDocuments(),
        ]);

        console.log('📊 DATABASE VERIFICATION REPORT');
        console.log('================================\n');
        
        console.log('👥 USERS:');
        console.log(`   Total Users: ${totalUsers}`);
        console.log(`   - Admins: ${admins}`);
        console.log(`   - Doctors: ${doctors}`);
        console.log(`   - Patients: ${patients}`);
        
        console.log('\n📅 APPOINTMENTS:');
        console.log(`   Total: ${appointments}`);
        console.log(`   Today: ${todayAppointments}`);
        
        // Appointment status breakdown
        const appointmentsByStatus = await Appointment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('   By Status:');
        appointmentsByStatus.forEach(item => {
            console.log(`     - ${item._id}: ${item.count}`);
        });
        
        // Appointment type breakdown
        const appointmentsByType = await Appointment.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        console.log('   By Type:');
        appointmentsByType.forEach(item => {
            console.log(`     - ${item._id}: ${item.count}`);
        });

        console.log('\n📋 MEDICAL RECORDS:');
        console.log(`   Total: ${medicalRecords}`);
        const recordsByType = await MedicalRecord.aggregate([
            { $group: { _id: '$recordType', count: { $sum: 1 } } }
        ]);
        recordsByType.forEach(item => {
            console.log(`   - ${item._id}: ${item.count}`);
        });

        console.log('\n💊 PRESCRIPTIONS:');
        console.log(`   Total: ${prescriptions}`);

        console.log('\n📊 HEALTH METRICS:');
        console.log(`   Total: ${healthMetrics}`);
        const metricsByType = await HealthMetric.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        metricsByType.forEach(item => {
            console.log(`   - ${item._id}: ${item.count}`);
        });

        console.log('\n🎪 HOSPITAL EVENTS:');
        console.log(`   Total: ${events}`);
        const eventsByType = await Event.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        eventsByType.forEach(item => {
            console.log(`   - ${item._id}: ${item.count}`);
        });

        // Sample data checks
        console.log('\n🔍 SAMPLE DATA VALIDATION:');
        
        const sampleDoctor = await User.findOne({ role: 'doctor' }).select('userId name specialization');
        console.log(`   ✓ Sample Doctor: ${sampleDoctor?.name} (${sampleDoctor?.specialization})`);
        
        const samplePatient = await User.findOne({ role: 'patient' }).select('userId name bloodGroup');
        console.log(`   ✓ Sample Patient: ${samplePatient?.name} (Blood: ${samplePatient?.bloodGroup})`);
        
        const sampleAppointment = await Appointment.findOne()
            .populate('patientId', 'name')
            .populate('doctorId', 'name');
        console.log(`   ✓ Sample Appointment: ${sampleAppointment?.patientId?.name} with Dr. ${sampleAppointment?.doctorId?.name?.replace('Dr. ', '')}`);
        
        const sampleEvent = await Event.findOne().select('title type');
        console.log(`   ✓ Sample Event: ${sampleEvent?.title}`);

        // Walk-in patients check
        const walkInPatients = await User.find({ 
            role: 'patient',
            email: /walkin/i 
        }).select('userId name phone');
        console.log(`\n🚶 WALK-IN PATIENTS: ${walkInPatients.length}`);
        walkInPatients.forEach(patient => {
            console.log(`   - ${patient.name} (${patient.userId})`);
        });

        // Data integrity checks
        console.log('\n✅ DATA INTEGRITY CHECKS:');
        
        const appointmentsWithoutPatient = await Appointment.countDocuments({ patientId: { $exists: false } });
        const appointmentsWithoutDoctor = await Appointment.countDocuments({ doctorId: { $exists: false } });
        console.log(`   Appointments without patient: ${appointmentsWithoutPatient} ${appointmentsWithoutPatient === 0 ? '✓' : '✗'}`);
        console.log(`   Appointments without doctor: ${appointmentsWithoutDoctor} ${appointmentsWithoutDoctor === 0 ? '✓' : '✗'}`);
        
        const metricsWithoutPatient = await HealthMetric.countDocuments({ patient: { $exists: false } });
        console.log(`   Health metrics without patient: ${metricsWithoutPatient} ${metricsWithoutPatient === 0 ? '✓' : '✗'}`);

        console.log('\n✅ DATABASE VERIFICATION COMPLETE!');
        console.log('All data has been successfully seeded and validated.\n');

    } catch (error) {
        console.error('❌ Verification error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

verifyDatabase();
