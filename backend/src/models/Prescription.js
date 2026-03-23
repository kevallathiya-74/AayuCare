const mongoose = require('mongoose');

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const prescriptionSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        index: true,
        validate: {
            validator: (v) => UUID_REGEX.test(v),
            message: 'patientId must be a valid PostgreSQL UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)',
        },
    },
    doctorId: {
        type: String,
        required: true,
        validate: {
            validator: (v) => UUID_REGEX.test(v),
            message: 'doctorId must be a valid PostgreSQL UUID',
        },
    },
    appointmentId: {
        type: String,
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
        enum: ['pending', 'preparing', 'ready', 'dispensed', 'cancelled'],
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
prescriptionSchema.index({ patientId: 1, hospitalId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ pharmacyStatus: 1 });
prescriptionSchema.index({ hospitalId: 1, pharmacyStatus: 1, createdAt: -1 });

// Validate at least one medicine is present
prescriptionSchema.path('medicines').validate(function(value) {
    return Array.isArray(value) && value.length >= 1;
}, 'At least one medicine is required in a prescription');

module.exports = mongoose.model('Prescription', prescriptionSchema);
