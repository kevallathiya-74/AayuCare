const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
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
    hospitalId: {
        type: String,
        required: true,
    },
    recordType: {
        type: String,
        enum: ['lab_report', 'prescription', 'doctor_visit', 'test_result', 'imaging', 'other'],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    files: [{
        url: String,
        fileName: String,
        fileType: String,
        fileSize: Number,
        uploadDate: {
            type: Date,
            default: Date.now,
        },
    }],
    diagnosis: {
        type: String,
        trim: true,
    },
    symptoms: [String],
    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
    }],
    labResults: [{
        testName: String,
        value: String,
        unit: String,
        normalRange: String,
        status: {
            type: String,
            enum: ['normal', 'abnormal', 'critical'],
            default: 'normal',
        },
    }],
    aiAnalysis: {
        insights: [String],
        riskScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        suggestions: {
            diet: [String],
            exercise: [String],
            lifestyle: [String],
            waterIntake: String,
        },
        preventiveMeasures: [String],
    },
    isShared: {
        type: Boolean,
        default: false,
    },
    sharedWith: [{
        userId: mongoose.Schema.Types.ObjectId,
        sharedDate: Date,
    }],
}, {
    timestamps: true,
});

// Indexes for faster queries
medicalRecordSchema.index({ patientId: 1, date: -1 });
medicalRecordSchema.index({ doctorId: 1, date: -1 });
medicalRecordSchema.index({ recordType: 1 });
medicalRecordSchema.index({ 'aiAnalysis.riskScore': -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
