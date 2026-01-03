/**
 * Comprehensive Seed Data Script
 * Creates realistic test data for all collections including:
 * - Multiple users (admins, doctors, patients)
 * - Walk-in patients
 * - Appointments (various statuses)
 * - Medical records with history
 * - Health metrics and vitals
 * - Hospital events
 * - Prescriptions
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');
const Prescription = require('../src/models/Prescription');
const MedicalRecord = require('../src/models/MedicalRecord');
const HealthMetric = require('../src/models/HealthMetric');
const Event = require('../src/models/Event');
const Notification = require('../src/models/Notification');
const bcrypt = require('bcryptjs');

const seedComprehensiveData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('[SUCCESS] Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({ userId: { $regex: /^(PAT00[2-9]|DOC00[2-5]|ADM002)/ } });
        await Appointment.deleteMany({});
        await Prescription.deleteMany({});
        await MedicalRecord.deleteMany({});
        await HealthMetric.deleteMany({});
        await Event.deleteMany({});
        await Notification.deleteMany({});
        console.log('[CLEANUP] Cleared existing test data');

        // Get or create base users
        let admin = await User.findOne({ userId: 'ADM001' });
        if (!admin) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            admin = await User.create({
                userId: 'ADM001',
                name: 'Admin User',
                email: 'admin@aayucare.com',
                password: hashedPassword,
                role: 'admin',
                phone: '9876543210',
                department: 'Administration',
                isActive: true,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            });
        }

        let doctor1 = await User.findOne({ userId: 'DOC001' });
        if (!doctor1) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            doctor1 = await User.create({
                userId: 'DOC001',
                name: 'Dr. Rajesh Kumar',
                email: 'rajesh@aayucare.com',
                password: hashedPassword,
                role: 'doctor',
                phone: '9876543211',
                specialization: 'Cardiology',
                qualification: 'MBBS, MD (Cardiology)',
                isActive: true,
                experience: 15,
                consultationFee: 500,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            });
        }

        // Create additional doctors
        const hashedPassword = await bcrypt.hash('password123', 10);
        const doctors = [
            {
                userId: 'DOC002',
                name: 'Dr. Priya Sharma',
                email: 'priya@aayucare.com',
                password: hashedPassword,
                role: 'doctor',
                phone: '9876543212',
                specialization: 'Pediatrics',
                qualification: 'MBBS, MD (Pediatrics)',
                isActive: true,
                experience: 10,
                consultationFee: 400,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
            {
                userId: 'DOC003',
                name: 'Dr. Amit Verma',
                email: 'amit@aayucare.com',
                password: hashedPassword,
                role: 'doctor',
                phone: '9876543213',
                specialization: 'Orthopedics',
                qualification: 'MBBS, MS (Orthopedics)',
                isActive: true,
                experience: 12,
                consultationFee: 600,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
            {
                userId: 'DOC004',
                name: 'Dr. Sunita Patel',
                email: 'sunita@aayucare.com',
                password: hashedPassword,
                role: 'doctor',
                phone: '9876543214',
                specialization: 'Gynecology',
                qualification: 'MBBS, MD (OB/GYN)',
                isActive: true,
                experience: 8,
                consultationFee: 450,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
            {
                userId: 'DOC005',
                name: 'Dr. Ramesh Gupta',
                email: 'ramesh@aayucare.com',
                password: hashedPassword,
                role: 'doctor',
                phone: '9876543215',
                specialization: 'General Medicine',
                qualification: 'MBBS, MD',
                isActive: true,
                experience: 20,
                consultationFee: 350,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
        ];

        const createdDoctors = await User.insertMany(doctors);
        console.log(`[SUCCESS] Created ${createdDoctors.length} additional doctors`);
        const allDoctors = [doctor1, ...createdDoctors];

        // Get or create base patient
        let patient1 = await User.findOne({ userId: 'PAT001' });
        if (!patient1) {
            patient1 = await User.create({
                userId: 'PAT001',
                name: 'Amit Patel',
                email: 'amit.patient@gmail.com',
                password: hashedPassword,
                role: 'patient',
                phone: '9123456780',
                dateOfBirth: new Date('1978-05-15'),
                age: 45,
                gender: 'male',
                bloodGroup: 'O+',
                isActive: true,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            });
        }

        // Create additional patients
        const patients = [
            {
                userId: 'PAT002',
                name: 'Sita Devi',
                email: 'sita@gmail.com',
                password: hashedPassword,
                role: 'patient',
                phone: '9123456781',
                dateOfBirth: new Date('1988-03-20'),
                age: 35,
                gender: 'female',
                bloodGroup: 'A+',
                isActive: true,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
            {
                userId: 'PAT003',
                name: 'Ravi Singh',
                email: 'ravi@gmail.com',
                password: hashedPassword,
                role: 'patient',
                phone: '9123456782',
                dateOfBirth: new Date('1995-07-10'),
                age: 28,
                gender: 'male',
                bloodGroup: 'B+',
                isActive: true,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
            {
                userId: 'PAT004',
                name: 'Meera Reddy',
                email: 'meera@gmail.com',
                password: hashedPassword,
                role: 'patient',
                phone: '9123456783',
                dateOfBirth: new Date('1971-11-30'),
                age: 52,
                gender: 'female',
                bloodGroup: 'AB+',
                isActive: true,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
            {
                userId: 'PAT005',
                name: 'Karan Mehta',
                email: 'karan@gmail.com',
                password: hashedPassword,
                role: 'patient',
                phone: '9123456784',
                dateOfBirth: new Date('1983-09-05'),
                age: 40,
                gender: 'male',
                bloodGroup: 'O-',
                isActive: true,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
            // Walk-in patients (minimal required fields)
            {
                userId: 'PAT006',
                name: 'Walk-in Patient 1',
                email: 'walkin1@temp.com',
                password: hashedPassword,
                role: 'patient',
                phone: '9123456785',
                dateOfBirth: new Date('1993-01-01'),
                age: 30,
                gender: 'male',
                bloodGroup: 'A-',
                isActive: true,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
            {
                userId: 'PAT007',
                name: 'Walk-in Patient 2',
                email: 'walkin2@temp.com',
                password: hashedPassword,
                role: 'patient',
                phone: '9123456786',
                dateOfBirth: new Date('1998-06-15'),
                age: 25,
                gender: 'female',
                bloodGroup: 'B-',
                isActive: true,
                hospitalId: 'HSP001',
                hospitalName: 'AayuCare Main Hospital',
            },
        ];

        const createdPatients = await User.insertMany(patients);
        console.log(`[SUCCESS] Created ${createdPatients.length} additional patients (including walk-ins)`);
        const allPatients = [patient1, ...createdPatients];

        // Create appointments with various statuses
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const appointments = [];
        const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
        const types = ['clinic_visit', 'follow_up', 'emergency', 'walk-in'];

        // Today's appointments
        for (let i = 0; i < 15; i++) {
            const hour = 9 + Math.floor(i / 2);
            const minute = (i % 2) * 30;
            const patientIndex = i % allPatients.length;
            const doctorIndex = i % allDoctors.length;
            
            appointments.push({
                patientId: allPatients[patientIndex]._id,
                doctorId: allDoctors[doctorIndex]._id,
                hospitalId: 'HSP001',
                appointmentDate: new Date(today.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000),
                appointmentTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                status: i < 5 ? 'scheduled' : i < 10 ? 'confirmed' : i < 13 ? 'completed' : 'cancelled',
                type: i < 12 ? types[i % types.length] : 'walk-in',
                symptoms: ['fever', 'headache', 'cough'][i % 3] ? [['fever', 'headache', 'cough'][i % 3]] : ['general checkup'],
                chiefComplaint: `Chief complaint ${i + 1}`,
                diagnosis: i >= 10 ? 'Diagnosis completed' : null,
            });
        }

        // Upcoming appointments (next 7 days)
        for (let day = 1; day <= 7; day++) {
            for (let i = 0; i < 5; i++) {
                const patientIndex = (day * 5 + i) % allPatients.length;
                const doctorIndex = (day * 3 + i) % allDoctors.length;
                const hour = 9 + i * 2;
                
                appointments.push({
                    patientId: allPatients[patientIndex]._id,
                    doctorId: allDoctors[doctorIndex]._id,
                    hospitalId: 'HSP001',
                    appointmentDate: new Date(today.getTime() + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000),
                    appointmentTime: `${hour.toString().padStart(2, '0')}:00`,
                    status: 'scheduled',
                    type: types[i % types.length],
                    symptoms: [['fever'], ['cough'], ['back pain'], ['headache'], ['checkup']][i % 5],
                    chiefComplaint: `Scheduled complaint ${day}-${i + 1}`,
                });
            }
        }

        const createdAppointments = await Appointment.insertMany(appointments);
        console.log(`[SUCCESS] Created ${createdAppointments.length} appointments`);

        // Create medical records
        const recordTypes = ['doctor_visit', 'lab_report', 'test_result', 'imaging', 'prescription', 'other'];
        const medicalRecords = [];

        for (let i = 0; i < 30; i++) {
            const patientIndex = i % allPatients.length;
            const doctorIndex = i % allDoctors.length;
            const daysAgo = Math.floor(Math.random() * 180); // Records from last 6 months
            
            medicalRecords.push({
                patientId: allPatients[patientIndex]._id,
                doctorId: allDoctors[doctorIndex]._id,
                hospitalId: 'HSP001',
                recordType: recordTypes[i % recordTypes.length],
                title: `Medical Record ${i + 1}`,
                description: `Detailed description of medical record ${i + 1}`,
                diagnosis: `Diagnosis ${i + 1}`,
                date: new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000),
            });
        }

        const createdRecords = await MedicalRecord.insertMany(medicalRecords);
        console.log(`[SUCCESS] Created ${createdRecords.length} medical records`);

        // Create health metrics
        const metricTypes = ['bp', 'sugar', 'weight', 'temperature', 'steps', 'sleep', 'water', 'heart-rate', 'oxygen'];
        const healthMetrics = [];

        for (let patientIndex = 0; patientIndex < Math.min(5, allPatients.length); patientIndex++) {
            // Create historical data (last 30 days)
            for (let day = 0; day < 30; day++) {
                const date = new Date(today.getTime() - day * 24 * 60 * 60 * 1000);
                
                healthMetrics.push(
                    {
                        patient: allPatients[patientIndex]._id,
                        type: 'bp',
                        value: { systolic: 120 + Math.floor(Math.random() * 20), diastolic: 80 + Math.floor(Math.random() * 10) },
                        unit: 'mmHg',
                        timestamp: date,
                        recordedBy: allDoctors[0]._id,
                        hospitalId: 'HSP001',
                    },
                    {
                        patient: allPatients[patientIndex]._id,
                        type: 'sugar',
                        value: { reading: 90 + Math.floor(Math.random() * 30), timing: 'fasting' },
                        unit: 'mg/dL',
                        timestamp: date,
                        recordedBy: allDoctors[0]._id,
                        hospitalId: 'HSP001',
                    },
                    {
                        patient: allPatients[patientIndex]._id,
                        type: 'weight',
                        value: 70 + Math.floor(Math.random() * 10),
                        unit: 'kg',
                        timestamp: date,
                        recordedBy: allPatients[patientIndex]._id,
                        hospitalId: 'HSP001',
                    },
                    {
                        patient: allPatients[patientIndex]._id,
                        type: 'steps',
                        value: 5000 + Math.floor(Math.random() * 5000),
                        unit: 'steps',
                        timestamp: date,
                        recordedBy: allPatients[patientIndex]._id,
                        hospitalId: 'HSP001',
                    },
                    {
                        patient: allPatients[patientIndex]._id,
                        type: 'sleep',
                        value: 6 + Math.floor(Math.random() * 3),
                        unit: 'hours',
                        timestamp: date,
                        recordedBy: allPatients[patientIndex]._id,
                        hospitalId: 'HSP001',
                    },
                    {
                        patient: allPatients[patientIndex]._id,
                        type: 'water',
                        value: 6 + Math.floor(Math.random() * 6),
                        unit: 'glasses',
                        timestamp: date,
                        recordedBy: allPatients[patientIndex]._id,
                        hospitalId: 'HSP001',
                    }
                );
            }
        }

        const createdMetrics = await HealthMetric.insertMany(healthMetrics);
        console.log(`[SUCCESS] Created ${createdMetrics.length} health metrics`);

        // Create hospital events
        const eventTypes = ['blood-donation', 'screening', 'vaccination', 'workshop', 'health-camp'];
        const events = [];

        for (let i = 0; i < 10; i++) {
            const daysFromNow = i * 3; // Events spread over 30 days
            const date = new Date(today.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
            const maxSpots = 50 + i * 10;
            const registeredCount = i < 5 ? Math.floor(Math.random() * 30) : 0;
            
            const event = {
                title: `${eventTypes[i % eventTypes.length]} Event ${i + 1}`,
                description: `Join us for ${eventTypes[i % eventTypes.length]} event. All are welcome!`,
                type: eventTypes[i % eventTypes.length],
                date,
                startTime: '09:00 AM',
                endTime: '05:00 PM',
                venue: `Hospital Hall ${String.fromCharCode(65 + (i % 5))}`,
                organizer: admin._id,
                maxSpots,
                registrations: [],
                status: i === 0 ? 'ongoing' : 'upcoming',
                hospitalId: 'HSP001',
            };

            // Add some registrations for past/ongoing events
            if (registeredCount > 0) {
                for (let j = 0; j < registeredCount; j++) {
                    const patientIndex = j % allPatients.length;
                    event.registrations.push({
                        user: allPatients[patientIndex]._id,
                        status: 'registered',
                    });
                }
            }

            events.push(event);
        }

        const createdEvents = await Event.insertMany(events);
        console.log(`[SUCCESS] Created ${createdEvents.length} events`);

        // Create prescriptions for completed appointments
        const completedAppts = createdAppointments.filter(apt => apt.status === 'completed');
        const prescriptions = completedAppts.slice(0, 10).map((apt, i) => ({
            patientId: apt.patientId,
            doctorId: apt.doctorId,
            appointmentId: apt._id,
            hospitalId: apt.hospitalId,
            medications: [
                {
                    name: ['Paracetamol', 'Amoxicillin', 'Cough Syrup', 'Vitamin D', 'Aspirin'][i % 5],
                    dosage: ['500mg', '250mg', '10ml', '1000IU', '75mg'][i % 5],
                    frequency: 'Twice daily',
                    duration: `${3 + (i % 4)} days`,
                    instructions: 'Take after meals',
                },
            ],
            diagnosis: apt.diagnosis || 'General consultation',
            notes: 'Follow up if symptoms persist',
            followUpDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        }));

        const createdPrescriptions = await Prescription.insertMany(prescriptions);
        console.log(`[SUCCESS] Created ${createdPrescriptions.length} prescriptions`);
// Create notifications
        const notificationTypes = ['appointment', 'prescription', 'lab_report', 'event', 'reminder', 'system', 'alert'];
        const priorities = ['low', 'medium', 'high', 'urgent'];
        const notifications = [];

        // Create notifications for each patient
        for (let i = 0; i < Math.min(5, allPatients.length); i++) {
            const patient = allPatients[i];
            const notifCount = 5 + Math.floor(Math.random() * 10); // 5-15 notifications per patient

            for (let j = 0; j < notifCount; j++) {
                const daysAgo = Math.floor(Math.random() * 7);
                const type = notificationTypes[j % notificationTypes.length];
                const priority = j < 3 ? priorities[Math.floor(Math.random() * priorities.length)] : 'medium';
                const isRead = Math.random() > 0.4; // 60% read, 40% unread

                const titles = {
                    appointment: ['Upcoming Appointment', 'Appointment Reminder', 'Appointment Confirmed'],
                    prescription: ['New Prescription Available', 'Prescription Ready', 'Refill Reminder'],
                    lab_report: ['Lab Results Ready', 'Test Results Available', 'Lab Report Published'],
                    event: ['Health Camp Tomorrow', 'Blood Donation Drive', 'Free Checkup Event'],
                    reminder: ['Take Your Medicine', 'Health Checkup Due', 'Follow-up Reminder'],
                    system: ['App Update Available', 'New Features Added', 'Maintenance Notice'],
                    alert: ['Urgent: Check Vitals', 'High Blood Pressure Alert', 'Important Health Notice'],
                };

                const messages = {
                    appointment: ['Your appointment is scheduled for tomorrow at 10 AM', 'Please arrive 15 minutes early', 'Dr. Kumar will see you at 2 PM'],
                    prescription: ['Your prescription is ready for pickup', 'Refill needed for your medication', 'New medication prescribed'],
                    lab_report: ['Your blood test results are now available', 'Check your latest lab reports', 'All test results are normal'],
                    event: ['Free health screening camp tomorrow', 'Blood donation drive on Dec 25', 'Join our health awareness workshop'],
                    reminder: ['Time to take your evening medication', 'Schedule your annual checkup', 'Follow-up appointment needed'],
                    system: ['New health tracking features available', 'App version 2.0 is here', 'System maintenance scheduled'],
                    alert: ['Please monitor your blood pressure', 'Irregular heart rate detected', 'Consult your doctor immediately'],
                };

                notifications.push({
                    userId: patient._id,
                    title: titles[type][j % titles[type].length],
                    message: messages[type][j % messages[type].length],
                    type,
                    priority,
                    read: isRead,
                    icon: type === 'appointment' ? 'calendar' : type === 'prescription' ? 'medical' : type === 'alert' ? 'warning' : 'notifications',
                    createdAt: new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000 - j * 60 * 60 * 1000),
                });
            }
        }

        // Add some doctor notifications
        for (let i = 0; i < Math.min(3, allDoctors.length); i++) {
            const doctor = allDoctors[i];
            
            notifications.push(
                {
                    userId: doctor._id,
                    title: 'New Patient Appointment',
                    message: 'You have 3 new appointments scheduled for today',
                    type: 'appointment',
                    priority: 'high',
                    read: false,
                    icon: 'calendar',
                    createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
                },
                {
                    userId: doctor._id,
                    title: 'Lab Results Uploaded',
                    message: 'Patient lab results are ready for review',
                    type: 'lab_report',
                    priority: 'medium',
                    read: true,
                    icon: 'flask',
                    createdAt: new Date(today.getTime() - 5 * 60 * 60 * 1000),
                }
            );
        }

        const createdNotifications = await Notification.insertMany(notifications);
        console.log(`[SUCCESS] Created ${createdNotifications.length} notifications`);

        
        console.log('\n[SUCCESS] Comprehensive data seeded successfully!');
        console.log('[STATS] Summary:');
        console.log(`   - Doctors: ${allDoctors.length} (including base doctor)`);
        console.log(`   - Patients: ${allPatients.length} (including 2 walk-ins)`);
        console.log(`   - Appointments: ${createdAppointments.length} (today: ${appointments.filter(a => a.appointmentDate >= today && a.appointmentDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)).length})`);
        console.log(`   - Medical Records: ${createdRecords.length}`);
        console.log(`   - Health Metrics: ${createdMetrics.length}`);
        console.log(`   - Events: ${createdEvents.length}`);
        console.log(`   - Prescriptions: ${createdPrescriptions.length}`);
        console.log(`   - Notifications: ${createdNotifications.length}`);

    } catch (error) {
        console.error('[ERROR] Error seeding comprehensive data:', error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('[SHUTDOWN] Disconnected from MongoDB');
        process.exit(0);
    }
};

seedComprehensiveData();
