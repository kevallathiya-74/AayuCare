/**
 * Seed Admin Notifications
 * Creates sample notifications for the admin user
 */

const mongoose = require('mongoose');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');
require('dotenv').config();

const seedAdminNotifications = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('[SUCCESS] Connected to MongoDB');

        // Find admin user
        const adminUser = await User.findOne({ role: 'admin', userId: 'ADM001' });
        
        if (!adminUser) {
            console.error('[ERROR] Admin user not found');
            process.exit(1);
        }

        console.log('[INFO] Found admin user:', adminUser.name, '(', adminUser._id, ')');

        // Delete existing admin notifications
        await Notification.deleteMany({ userId: adminUser._id });
        console.log('[CLEANUP] Cleared existing admin notifications');

        // Create admin-specific notifications
        const adminNotifications = [
            {
                userId: adminUser._id,
                title: 'New Doctor Registration',
                message: 'Dr. Rajesh Kumar has completed registration and is pending approval',
                type: 'system',
                priority: 'high',
                read: false,
                icon: 'person-add',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            },
            {
                userId: adminUser._id,
                title: 'System Health Alert',
                message: 'Database backup completed successfully. Next backup scheduled in 24 hours',
                type: 'system',
                priority: 'low',
                read: false,
                icon: 'shield-checkmark',
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            },
            {
                userId: adminUser._id,
                title: 'High Appointment Volume',
                message: 'Today\'s appointment count has reached 45 bookings. Consider adding more slots',
                type: 'alert',
                priority: 'medium',
                read: false,
                icon: 'warning',
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            },
            {
                userId: adminUser._id,
                title: 'New Patient Registered',
                message: '5 new patients registered today. Total active patients: 320',
                type: 'system',
                priority: 'low',
                read: true,
                icon: 'people',
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            },
            {
                userId: adminUser._id,
                title: 'Revenue Milestone',
                message: 'Monthly revenue has crossed ₹5,00,000! Great progress this month',
                type: 'system',
                priority: 'medium',
                read: true,
                icon: 'cash',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            },
            {
                userId: adminUser._id,
                title: 'Event Registration Full',
                message: 'Blood Donation Camp is now fully booked with 50 registrations',
                type: 'event',
                priority: 'low',
                read: true,
                icon: 'calendar',
                createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
            },
            {
                userId: adminUser._id,
                title: 'Doctor Availability Update',
                message: 'Dr. Priya Sharma has updated availability for next week',
                type: 'system',
                priority: 'low',
                read: true,
                icon: 'time',
                createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
            },
            {
                userId: adminUser._id,
                title: 'Prescription Stats',
                message: '125 prescriptions issued this week. Average processing time: 15 minutes',
                type: 'system',
                priority: 'low',
                read: true,
                icon: 'medical',
                createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
            },
        ];

        // Insert notifications
        const created = await Notification.insertMany(adminNotifications);
        console.log(`[SUCCESS] Created ${created.length} notifications for admin user`);

        console.log('\n[SUMMARY] Admin Notifications:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Total Notifications: ${created.length}`);
        console.log(`Unread: ${adminNotifications.filter(n => !n.read).length}`);
        console.log(`Read: ${adminNotifications.filter(n => n.read).length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('[ERROR] Error seeding admin notifications:', error);
        process.exit(1);
    }
};

seedAdminNotifications();
