const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
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
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    hospitalId: {
        type: String,
        required: true,
    },
    prescriptionDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    medicines: [{
        name: {
            type: String,
            required: true,
        },
        genericName: String,
        dosage: {
            type: String,
            required: true,
        },
        frequency: {
            type: String,
            required: true,
        },
        duration: {
            type: String,
            required: true,
        },
        timing: {
            type: String,
            enum: ['before_food', 'after_food', 'with_food', 'anytime'],
        },
        instructions: String,
        price: Number,
    }],
    diagnosis: String,
    instructions: String,
    followUpDate: Date,
    pharmacyStatus: {
        type: String,
        enum: ['pending', 'sent_to_pharmacy', 'preparing', 'ready', 'dispensed'],
        default: 'pending',
    },
    pharmacyId: String,
    payment: {
        totalAmount: Number,
        discount: {
            type: Number,
            default: 0,
        },
        finalAmount: Number,
        status: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending',
        },
        method: {
            type: String,
            enum: ['cash', 'online', 'insurance'],
        },
        transactionId: String,
        paidAt: Date,
    },
    isSentToPatient: {
        type: Boolean,
        default: false,
    },
    sentToPatientAt: Date,
}, {
    timestamps: true,
});

// Indexes
prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ pharmacyStatus: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
