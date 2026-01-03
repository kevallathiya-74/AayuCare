/**
 * Notification Service
 * Handles push notifications, in-app alerts, and notification management
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const twilioService = require('./twilioService');
const logger = require('../utils/logger');

class NotificationService {
    /**
     * Create a new notification
     */
    async createNotification(notificationData) {
        try {
            const notification = await Notification.create(notificationData);
            logger.info(`[Notification] Created: ${notification._id}`);
            
            // Send push notification if enabled
            if (notificationData.sendPush) {
                await this.sendPushNotification(notification);
            }

            // Send SMS if urgent
            if (notificationData.priority === 'urgent' && notificationData.sendSMS) {
                await this.sendSMSNotification(notification);
            }

            return notification;
        } catch (error) {
            logger.error('[Notification] Creation failed:', error.message);
            throw error;
        }
    }

    /**
     * Send appointment reminder notifications
     */
    async sendAppointmentReminder(appointment, patient, doctor) {
        try {
            // Create in-app notification
            await this.createNotification({
                userId: patient._id,
                hospitalId: appointment.hospitalId,
                type: 'appointment',
                title: 'Appointment Reminder',
                message: `Your appointment with Dr. ${doctor.name} is tomorrow at ${appointment.appointmentTime}`,
                priority: 'high',
                metadata: {
                    appointmentId: appointment._id,
                    doctorId: doctor._id,
                },
            });

            // Send SMS
            await twilioService.sendAppointmentReminder(appointment, patient, doctor);

            logger.info(`[Notification] Appointment reminder sent to ${patient.name}`);
        } catch (error) {
            logger.error('[Notification] Appointment reminder failed:', error.message);
        }
    }

    /**
     * Send prescription ready notification
     */
    async sendPrescriptionNotification(prescription, patient, doctor) {
        try {
            await this.createNotification({
                userId: patient._id,
                hospitalId: prescription.hospitalId,
                type: 'prescription',
                title: 'Prescription Ready',
                message: `Your prescription from Dr. ${doctor.name} is ready for collection`,
                priority: 'normal',
                metadata: {
                    prescriptionId: prescription._id,
                },
            });

            await twilioService.sendPrescriptionNotification(patient, doctor.name);

            logger.info(`[Notification] Prescription notification sent to ${patient.name}`);
        } catch (error) {
            logger.error('[Notification] Prescription notification failed:', error.message);
        }
    }

    /**
     * Send health alert notification
     */
    async sendHealthAlert(userId, hospitalId, alertData) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            await this.createNotification({
                userId: user._id,
                hospitalId,
                type: 'health_alert',
                title: alertData.title || 'Health Alert',
                message: alertData.message,
                priority: alertData.priority || 'high',
                metadata: alertData.metadata || {},
            });

            if (alertData.sendSMS) {
                await twilioService.sendHealthAlert(user, alertData.message);
            }

            logger.info(`[Notification] Health alert sent to ${user.name}`);
        } catch (error) {
            logger.error('[Notification] Health alert failed:', error.message);
        }
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId, options = {}) {
        const { page = 1, limit = 20, unreadOnly = false } = options;
        
        const query = { userId };
        if (unreadOnly) {
            query.read = false;
        }

        const skip = (page - 1) * limit;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ userId, read: false });

        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            unreadCount,
        };
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOne({
            _id: notificationId,
            userId,
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        return notification;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        await Notification.updateMany(
            { userId, read: false },
            { read: true, readAt: new Date() }
        );
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId, userId) {
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId,
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        return notification;
    }

    /**
     * Send push notification (placeholder for future implementation)
     */
    async sendPushNotification(notification) {
        // TODO: Implement with Firebase Cloud Messaging or OneSignal
        logger.info('[Notification] Push notification would be sent:', notification.title);
        return true;
    }

    /**
     * Send SMS notification
     */
    async sendSMSNotification(notification) {
        try {
            const user = await User.findById(notification.userId);
            if (!user || !user.phone) {
                return;
            }

            await twilioService.sendSMS(
                user.phone,
                `AayuCare: ${notification.title}\n${notification.message}`
            );
        } catch (error) {
            logger.error('[Notification] SMS notification failed:', error.message);
        }
    }
}

module.exports = new NotificationService();
