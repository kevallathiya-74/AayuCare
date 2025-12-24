const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    hospitalId: {
        type: String,
        required: true,
    },
    appointmentDate: {
        type: Date,
        required: true,
        index: true,
    },
    appointmentTime: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled',
        index: true,
    },
    type: {
        type: String,
        enum: ['clinic_visit', 'telemedicine', 'emergency', 'follow_up', 'walk-in'],
        required: true,
    },
    symptoms: [String],
    chiefComplaint: String,
    diagnosis: String,
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
    },
    notes: String,
    followUp: {
        required: Boolean,
        date: Date,
        reason: String,
    },
    payment: {
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending',
        },
        method: String,
        transactionId: String,
    },
    cancelReason: String,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    cancelledAt: Date,
}, {
    timestamps: true,
});

// Indexes
appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
