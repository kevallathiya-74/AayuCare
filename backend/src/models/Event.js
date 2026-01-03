/**
 * Event Model
 * Hospital events, camps, and health programs
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    hospitalId: {
        type: String,
        required: [true, 'Hospital ID is required'],
        index: true,
        trim: true,
        uppercase: true,
    },
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
    },
    type: {
        type: String,
        enum: ['blood-donation', 'screening', 'vaccination', 'workshop', 'health-camp', 'awareness', 'other'],
        required: [true, 'Event type is required'],
    },
    icon: {
        type: String,
        default: 'calendar',
    },
    color: {
        type: String,
        default: '#2196F3',
    },
    date: {
        type: Date,
        required: [true, 'Event date is required'],
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
    },
    venue: {
        type: String,
        required: [true, 'Venue is required'],
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    availableSpots: {
        type: Number,
        default: 0,
    },
    registeredCount: {
        type: Number,
        default: 0,
    },
    registrations: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        registeredAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['registered', 'attended', 'cancelled'],
            default: 'registered',
        },
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming',
    },
    requirements: [String],
    benefits: [String],
    contactInfo: {
        phone: String,
        email: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries
eventSchema.index({ hospitalId: 1, date: 1, status: 1 });
eventSchema.index({ hospitalId: 1, type: 1 });
eventSchema.index({ hospitalId: 1, isActive: 1 });

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
    return this.availableSpots > 0 && this.registeredCount >= this.availableSpots;
});

// Update status based on date
eventSchema.methods.updateStatus = function() {
    const now = new Date();
    const eventDate = new Date(this.date);
    
    if (this.status === 'cancelled') {
        return this.status;
    }
    
    if (eventDate > now) {
        this.status = 'upcoming';
    } else if (eventDate.toDateString() === now.toDateString()) {
        this.status = 'ongoing';
    } else {
        this.status = 'completed';
    }
    
    return this.status;
};

module.exports = mongoose.model('Event', eventSchema);
