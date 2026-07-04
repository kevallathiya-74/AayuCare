/**
 * Notification Service
 * Handles push notifications, in-app alerts, and notification management
 */

const notificationRepository = require("../notification/notification.repository");
const userRepository = require("../auth/user.repository");
const twilioService = require("../../utils/twilioService");
const logger = require("../../utils/logger");

class NotificationService {
    /**
     * Create a new notification
     */
    async createNotification(notificationData) {
        try {
            const notification = await notificationRepository.create(notificationData);
            logger.info(`[Notification] Created: ${notification.id}`);
            
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
                userId: patient.id,
                hospitalId: appointment.hospitalId,
                type: 'appointment',
                title: 'Appointment Reminder',
                message: `Your appointment with Dr. ${doctor.name} is tomorrow at ${appointment.appointmentTime}`,
                priority: 'high',
                metadata: {
                    appointmentId: appointment.id,
                    doctorId: doctor.id,
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
                userId: patient.id,
                hospitalId: prescription.hospitalId,
                type: 'prescription',
                title: 'Prescription Ready',
                message: `Your prescription from Dr. ${doctor.name} is ready for collection`,
                priority: 'medium',
                metadata: {
                    prescriptionId: prescription.id,
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
            const user = await userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            await this.createNotification({
                userId: user.id,
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

        const notifications = await notificationRepository.findWithFilters(query, {
            offset: skip,
            limit: limit,
            sort: { createdAt: -1 }
        });

        const total = await notificationRepository.count(query);
        const unreadCount = await notificationRepository.count({ userId, read: false });

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
        const notification = await notificationRepository.findById(notificationId);

        if (!notification || notification.userId !== userId) {
            throw new Error('Notification not found');
        }

        const updated = await notificationRepository.update(notificationId, {
            read: true,
        });

        return updated || notification;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        await notificationRepository.updateMany(
            { userId, read: false },
            { read: true, readAt: new Date() }
        );
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId, userId) {
        const notification = await notificationRepository.deleteByIdAndUserId(
            notificationId,
            userId
        );

        if (!notification) {
            throw new Error('Notification not found');
        }

        return notification;
    }

    /**
     * Send push notification using Expo Push API
     */
    async sendPushNotification(notification) {
        try {
            const user = await userRepository.findByUserId(notification.userId);
            if (!user || !user.expo_push_token) {
                logger.info(`[Notification] Skipped push for ${notification.userId}: No Expo token`);
                return false;
            }

            const message = {
                to: user.expo_push_token,
                sound: 'default',
                title: notification.title,
                body: notification.message,
                data: notification.metadata || {},
            };

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const ticket = await response.json();
            logger.info('[Notification] Push notification sent:', ticket);
            return true;
        } catch (error) {
            logger.error('[Notification] Push notification error:', error.message);
            return false;
        }
    }

    /**
     * Send SMS notification
     */
    async sendSMSNotification(notification) {
        try {
            const user = await userRepository.findById(notification.userId);
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
