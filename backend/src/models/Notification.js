/**
 * Notification Model
 * Push notifications and in-app alerts for users
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['appointment', 'prescription', 'lab_report', 'event', 'reminder', 'system', 'alert'],
        required: true,
        default: 'system',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        // Additional data like appointmentId, prescriptionId, etc.
    },
    actionUrl: {
        type: String,
        // Deep link or navigation path
    },
    icon: {
        type: String,
        default: 'notifications',
    },
    expiresAt: {
        type: Date,
        // Auto-delete old notifications
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
notificationSchema.methods.markAsRead = async function() {
    this.read = true;
    return await this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({ userId, read: false });
};

notificationSchema.statics.markAllAsRead = async function(userId) {
    return await this.updateMany(
        { userId, read: false },
        { read: true }
    );
};

notificationSchema.statics.createNotification = async function(notificationData) {
    return await this.create(notificationData);
};

// Virtual for time since notification
notificationSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
