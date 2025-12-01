const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vitalSigns: {
    heartRate: {
      value: Number,
      unit: { type: String, default: 'bpm' },
      recordedAt: Date
    },
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      unit: { type: String, default: 'mmHg' },
      recordedAt: Date
    },
    temperature: {
      value: Number,
      unit: { type: String, default: '°C' },
      recordedAt: Date
    },
    oxygenSaturation: {
      value: Number,
      unit: { type: String, default: '%' },
      recordedAt: Date
    },
    weight: {
      value: Number,
      unit: { type: String, default: 'kg' },
      recordedAt: Date
    },
    height: {
      value: Number,
      unit: { type: String, default: 'cm' },
      recordedAt: Date
    },
    bloodSugar: {
      value: Number,
      unit: { type: String, default: 'mg/dL' },
      type: { type: String, enum: ['fasting', 'random', 'post-meal'] },
      recordedAt: Date
    }
  },
  symptoms: [{
    description: String,
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    startDate: Date,
    endDate: Date
  }],
  labResults: [{
    testName: String,
    result: String,
    normalRange: String,
    date: Date,
    notes: String
  }],
  prescriptions: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    prescribedBy: String,
    prescribedDate: Date
  }],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

healthRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
