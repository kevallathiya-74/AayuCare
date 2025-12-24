/**
 * Seed Dashboard Data
 * Creates sample appointments and prescriptions for testing
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');
const Prescription = require('../src/models/Prescription');

const seedDashboardData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('[SUCCESS] Connected to MongoDB');

        // Get doctor and patient
        const doctor = await User.findOne({ userId: 'DOC001' });
        const patient = await User.findOne({ userId: 'PAT001' });

        if (!doctor || !patient) {
            console.error('[ERROR] Doctor or Patient not found');
            process.exit(1);
        }

        console.log('Found Doctor:', doctor.name);
        console.log('Found Patient:', patient.name);

        // Clear existing appointments and prescriptions
        await Appointment.deleteMany({ doctorId: doctor._id });
        await Prescription.deleteMany({ doctorId: doctor._id });
        console.log('[CLEANUP] Cleared existing data');

        // Create today's date at different times
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const appointments = [
            {
                patientId: patient._id,
                doctorId: doctor._id,
                hospitalId: 'HSP001',
                appointmentDate: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM
                appointmentTime: '09:00 AM',
                status: 'scheduled',
                type: 'clinic_visit',
                symptoms: ['fever', 'headache'],
                chiefComplaint: 'Fever and headache for 3 days',
            },
            {
                patientId: patient._id,
                doctorId: doctor._id,
                hospitalId: 'HSP001',
                appointmentDate: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11:00 AM
                appointmentTime: '11:00 AM',
                status: 'confirmed',
                type: 'follow_up',
                symptoms: ['chest pain'],
                chiefComplaint: 'Follow-up for cardiac check',
            },
            {
                patientId: patient._id,
                doctorId: doctor._id,
                hospitalId: 'HSP001',
                appointmentDate: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
                appointmentTime: '02:00 PM',
                status: 'scheduled',
                type: 'clinic_visit',
                symptoms: ['cough', 'cold'],
                chiefComplaint: 'Persistent cough',
            },
            {
                patientId: patient._id,
                doctorId: doctor._id,
                hospitalId: 'HSP001',
                appointmentDate: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4:00 PM
                appointmentTime: '04:00 PM',
                status: 'completed',
                type: 'clinic_visit',
                symptoms: ['fever'],
                chiefComplaint: 'Fever',
                diagnosis: 'Viral fever',
            },
            // Tomorrow's appointments
            {
                patientId: patient._id,
                doctorId: doctor._id,
                hospitalId: 'HSP001',
                appointmentDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // Tomorrow 10:00 AM
                appointmentTime: '10:00 AM',
                status: 'scheduled',
                type: 'clinic_visit',
                symptoms: ['back pain'],
                chiefComplaint: 'Lower back pain',
            },
        ];

        const createdAppointments = await Appointment.insertMany(appointments);
        console.log(`[SUCCESS] Created ${createdAppointments.length} appointments`);

        // Create prescriptions
        const prescriptions = [
            {
                patientId: patient._id,
                doctorId: doctor._id,
                appointmentId: createdAppointments[3]._id,
                hospitalId: 'HSP001',
                medications: [
                    {
                        name: 'Paracetamol',
                        dosage: '500mg',
                        frequency: 'Twice daily',
                        duration: '3 days',
                        instructions: 'Take after meals',
                    },
                    {
                        name: 'Vitamin C',
                        dosage: '500mg',
                        frequency: 'Once daily',
                        duration: '7 days',
                        instructions: 'Take with water',
                    },
                ],
                diagnosis: 'Viral fever',
                notes: 'Rest and drink plenty of fluids',
                followUpDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
            },
        ];

        const createdPrescriptions = await Prescription.insertMany(prescriptions);
        console.log(`[SUCCESS] Created ${createdPrescriptions.length} prescriptions`);

        console.log('\n[SUCCESS] Dashboard data seeded successfully!');
        console.log('[STATS] Summary:');
        console.log(`   - Appointments: ${createdAppointments.length}`);
        console.log(`   - Today's Appointments: ${createdAppointments.filter(a => a.appointmentDate >= today && a.appointmentDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)).length}`);
        console.log(`   - Prescriptions: ${createdPrescriptions.length}`);

    } catch (error) {
        console.error('[ERROR] Error seeding data:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('[SHUTDOWN] Disconnected from MongoDB');
        process.exit(0);
    }
};

seedDashboardData();
