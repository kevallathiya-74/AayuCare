/**
 * Email Service
 * Handles email notifications and communications
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;

        this.initialize();
    }

    /**
     * Initialize email service
     */
    initialize() {
        const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;

        if (EMAIL_HOST && EMAIL_USER && EMAIL_PASSWORD) {
            try {
                this.transporter = nodemailer.createTransport({
                    host: EMAIL_HOST,
                    port: parseInt(EMAIL_PORT) || 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: EMAIL_USER,
                        pass: EMAIL_PASSWORD,
                    },
                });

                this.isConfigured = true;
                logger.info('[Email] Service initialized successfully');
            } catch (error) {
                logger.error('[Email] Initialization failed:', error.message);
            }
        } else {
            logger.warn('[Email] Service not configured - add EMAIL credentials to .env');
        }
    }

    /**
     * Send email
     */
    async sendEmail({ to, subject, html, text }) {
        try {
            if (!this.isConfigured) {
                logger.info(`[Email] Would send to ${to}: ${subject}`);
                return { success: false, message: 'Email service not configured' };
            }

            const mailOptions = {
                from: `"AayuCare" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
                to,
                subject,
                text,
                html,
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            logger.info(`[Email] Sent successfully to ${to} - MessageID: ${info.messageId}`);
            
            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            logger.error('[Email] Send failed:', error.message);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(user) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to AayuCare! 🏥</h1>
        </div>
        <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>Thank you for joining AayuCare - Your trusted healthcare companion.</p>
            
            <p><strong>Your Account Details:</strong></p>
            <ul>
                <li><strong>User ID:</strong> ${user.userId}</li>
                <li><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</li>
                <li><strong>Email:</strong> ${user.email}</li>
            </ul>

            <p>You can now access all features of AayuCare including:</p>
            <ul>
                <li>📅 Book and manage appointments</li>
                <li>📋 Access medical records</li>
                <li>💊 View prescriptions</li>
                <li>📊 Track health metrics</li>
                <li>🔔 Receive important notifications</li>
            </ul>

            <p style="text-align: center;">
                <a href="https://aayucare.app" class="button">Get Started</a>
            </p>

            <p>If you have any questions, feel free to contact our support team.</p>

            <p>Best regards,<br><strong>AayuCare Team</strong></p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} AayuCare. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
        `;

        return await this.sendEmail({
            to: user.email,
            subject: 'Welcome to AayuCare - Your Healthcare Journey Begins',
            html,
            text: `Welcome to AayuCare! Your User ID is ${user.userId}`,
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>We received a request to reset your AayuCare account password.</p>
            
            <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </p>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">
                ${resetUrl}
            </p>

            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
                </ul>
            </div>

            <p>Best regards,<br><strong>AayuCare Security Team</strong></p>
        </div>
    </div>
</body>
</html>
        `;

        return await this.sendEmail({
            to: user.email,
            subject: 'AayuCare - Password Reset Request',
            html,
            text: `Reset your password: ${resetUrl}`,
        });
    }

    /**
     * Send appointment confirmation email
     */
    async sendAppointmentConfirmationEmail(appointment, patient, doctor) {
        const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .appointment-details { background: white; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Appointment Confirmed</h1>
        </div>
        <div class="content">
            <h2>Hello ${patient.name},</h2>
            <p>Your appointment has been successfully confirmed!</p>
            
            <div class="appointment-details">
                <h3>Appointment Details:</h3>
                <ul>
                    <li><strong>Doctor:</strong> Dr. ${doctor.name}</li>
                    <li><strong>Specialization:</strong> ${doctor.specialization}</li>
                    <li><strong>Date:</strong> ${appointmentDate}</li>
                    <li><strong>Time:</strong> ${appointment.appointmentTime}</li>
                    <li><strong>Type:</strong> ${appointment.type}</li>
                    <li><strong>Appointment ID:</strong> ${appointment._id}</li>
                </ul>
            </div>

            <p><strong>Important Reminders:</strong></p>
            <ul>
                <li>Please arrive 10 minutes before your appointment time</li>
                <li>Bring your previous medical records if any</li>
                <li>Carry a valid ID proof</li>
            </ul>

            <p>Best regards,<br><strong>AayuCare Team</strong></p>
        </div>
    </div>
</body>
</html>
        `;

        return await this.sendEmail({
            to: patient.email,
            subject: `Appointment Confirmed with Dr. ${doctor.name}`,
            html,
            text: `Your appointment with Dr. ${doctor.name} is confirmed for ${appointmentDate} at ${appointment.appointmentTime}`,
        });
    }
}

module.exports = new EmailService();
