/**
 * Twilio Service - SMS & OTP Management
 * Handles SMS notifications, OTP verification, and appointment reminders
 */

const twilio = require('twilio');
const logger = require('../utils/logger');

class TwilioService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
        this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        // Initialize Twilio client if credentials are provided
        if (this.accountSid && this.authToken && this.phoneNumber) {
            this.client = twilio(this.accountSid, this.authToken);
            this.isConfigured = true;
            logger.info('[Twilio] Service initialized successfully');
        } else {
            this.isConfigured = false;
            logger.warn('[Twilio] Service not configured - SMS features disabled');
            logger.warn('[Twilio] Please add TWILIO credentials to .env file');
        }
    }

    /**
     * Check if Twilio is properly configured
     */
    checkConfiguration() {
        if (!this.isConfigured) {
            logger.warn('[Twilio] Service not configured');
            return false;
        }
        return true;
    }

    /**
     * Send SMS message
     * @param {string} to - Recipient phone number (E.164 format)
     * @param {string} body - Message content
     * @returns {Promise<object>} - Twilio message object
     */
    async sendSMS(to, body) {
        try {
            if (!this.checkConfiguration()) {
                logger.info(`[Twilio] SMS would be sent to ${to}: ${body}`);
                return { success: false, message: 'SMS service not configured' };
            }

            // Validate phone number format
            if (!to.startsWith('+')) {
                to = `+91${to}`; // Default to India country code
            }

            const message = await this.client.messages.create({
                body,
                from: this.phoneNumber,
                to,
            });

            logger.info(`[Twilio] SMS sent successfully to ${to} - SID: ${message.sid}`);
            return {
                success: true,
                messageSid: message.sid,
                status: message.status,
            };
        } catch (error) {
            logger.error('[Twilio] SMS send failed:', error.message);
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }

    /**
     * Send OTP for verification
     * @param {string} phoneNumber - Recipient phone number
     * @returns {Promise<object>} - Verification object
     */
    async sendOTP(phoneNumber) {
        try {
            if (!this.checkConfiguration()) {
                logger.info(`[Twilio] OTP would be sent to ${phoneNumber}`);
                return { success: false, message: 'OTP service not configured' };
            }

            if (!phoneNumber.startsWith('+')) {
                phoneNumber = `+91${phoneNumber}`;
            }

            const verification = await this.client.verify.v2
                .services(this.verifyServiceSid)
                .verifications.create({
                    to: phoneNumber,
                    channel: 'sms',
                });

            logger.info(`[Twilio] OTP sent to ${phoneNumber} - Status: ${verification.status}`);
            return {
                success: true,
                status: verification.status,
                to: phoneNumber,
            };
        } catch (error) {
            logger.error('[Twilio] OTP send failed:', error.message);
            throw new Error(`Failed to send OTP: ${error.message}`);
        }
    }

    /**
     * Verify OTP
     * @param {string} phoneNumber - Phone number to verify
     * @param {string} code - OTP code
     * @returns {Promise<object>} - Verification result
     */
    async verifyOTP(phoneNumber, code) {
        try {
            if (!this.checkConfiguration()) {
                logger.info(`[Twilio] OTP verification skipped for ${phoneNumber}`);
                return { success: false, message: 'OTP service not configured' };
            }

            if (!phoneNumber.startsWith('+')) {
                phoneNumber = `+91${phoneNumber}`;
            }

            const verificationCheck = await this.client.verify.v2
                .services(this.verifyServiceSid)
                .verificationChecks.create({
                    to: phoneNumber,
                    code,
                });

            const isValid = verificationCheck.status === 'approved';
            
            logger.info(`[Twilio] OTP verification for ${phoneNumber}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
            
            return {
                success: isValid,
                status: verificationCheck.status,
            };
        } catch (error) {
            logger.error('[Twilio] OTP verification failed:', error.message);
            throw new Error(`Failed to verify OTP: ${error.message}`);
        }
    }

    /**
     * Send appointment confirmation SMS
     */
    async sendAppointmentConfirmation(appointment, patient, doctor) {
        const message = `
AayuCare - Appointment Confirmed

Patient: ${patient.name}
Doctor: Dr. ${doctor.name} (${doctor.specialization})
Date: ${new Date(appointment.appointmentDate).toLocaleDateString('en-IN')}
Time: ${appointment.appointmentTime}
Type: ${appointment.type}

Hospital Contact: +91-XXXXXXXXXX

Reply CANCEL to cancel appointment.
        `.trim();

        return await this.sendSMS(patient.phone, message);
    }

    /**
     * Send appointment reminder SMS (24 hours before)
     */
    async sendAppointmentReminder(appointment, patient, doctor) {
        const message = `
AayuCare - Appointment Reminder

Hi ${patient.name},

Your appointment is tomorrow!
Doctor: Dr. ${doctor.name}
Time: ${appointment.appointmentTime}
Date: ${new Date(appointment.appointmentDate).toLocaleDateString('en-IN')}

Please arrive 10 minutes early.
        `.trim();

        return await this.sendSMS(patient.phone, message);
    }

    /**
     * Send prescription ready notification
     */
    async sendPrescriptionNotification(patient, doctorName) {
        const message = `
AayuCare - Prescription Ready

Hi ${patient.name},

Your prescription from Dr. ${doctorName} is ready.
You can collect it from the pharmacy.

Show this SMS at the pharmacy counter.
        `.trim();

        return await this.sendSMS(patient.phone, message);
    }

    /**
     * Send health alert notification
     */
    async sendHealthAlert(patient, alertMessage) {
        const message = `
AayuCare - Health Alert

Hi ${patient.name},

${alertMessage}

Please consult your doctor if you have any concerns.
        `.trim();

        return await this.sendSMS(patient.phone, message);
    }

    /**
     * Send bulk SMS to multiple recipients
     */
    async sendBulkSMS(recipients, message) {
        try {
            if (!this.checkConfiguration()) {
                logger.info(`[Twilio] Bulk SMS would be sent to ${recipients.length} recipients`);
                return { success: false, message: 'SMS service not configured' };
            }

            const promises = recipients.map(phone => this.sendSMS(phone, message));
            const results = await Promise.allSettled(promises);

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            logger.info(`[Twilio] Bulk SMS completed - Success: ${successful}, Failed: ${failed}`);

            return {
                success: true,
                total: recipients.length,
                successful,
                failed,
            };
        } catch (error) {
            logger.error('[Twilio] Bulk SMS failed:', error.message);
            throw new Error(`Failed to send bulk SMS: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = new TwilioService();
