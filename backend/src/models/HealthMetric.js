/**
 * Health Metric Model
 * Stores patient health data including vital signs and activity tracking
 */

const mongoose = require('mongoose');

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const healthMetricSchema = new mongoose.Schema({
    hospitalId: {
        type: String,
        required: [true, 'Hospital ID is required'],
        index: true,
        trim: true,
        uppercase: true,
    },
    patient: {
        type: String,
        required: [true, 'Patient reference is required'],
        index: true,
        validate: {
            validator: (v) => UUID_REGEX.test(v),
            message: 'patient must be a valid PostgreSQL UUID',
        },
    },
    type: {
        type: String,
        enum: [
            'bp',           // Blood Pressure
            'sugar',        // Blood Sugar
            'weight',       // Weight
            'bmi',          // Body Mass Index
            'temperature',  // Body Temperature
            'steps',        // Daily Steps
            'sleep',        // Sleep Data
            'water',        // Water Intake
            'exercise',     // Exercise Activity
            'stress',       // Stress Level
            'heart-rate',   // Heart Rate
            'oxygen',       // Oxygen Saturation
        ],
        required: [true, 'Metric type is required'],
        index: true,
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Metric value is required'],
    },
    unit: {
        type: String,
        required: false,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    recordedBy: {
        type: String,
        required: false,
    },
    source: {
        type: String,
        enum: ['manual', 'device', 'app', 'doctor'],
        default: 'manual',
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});

// Compound indexes for efficient queries
healthMetricSchema.index({ hospitalId: 1, patient: 1, timestamp: -1 });
healthMetricSchema.index({ patient: 1, type: 1, timestamp: -1 });
healthMetricSchema.index({ patient: 1, timestamp: -1 });

// Validation for specific metric types
healthMetricSchema.pre('save', function() {
    const metric = this;
    const value = metric.value;
    
    // Validate blood pressure format
    if (metric.type === 'bp') {
        if (
            !value ||
            typeof value !== 'object' ||
            value.systolic == null ||
            value.diastolic == null
        ) {
            throw new Error('Blood pressure requires systolic and diastolic values');
        }
        metric.unit = 'mmHg';
    }
    
    // Validate blood sugar
    if (metric.type === 'sugar') {
        if (typeof value !== 'number') {
            throw new Error('Blood sugar must be a number');
        }
        metric.unit = 'mg/dL';
    }
    
    // Validate weight
    if (metric.type === 'weight') {
        if (typeof value !== 'number') {
            throw new Error('Weight must be a number');
        }
        metric.unit = 'kg';
    }
    
    // Validate BMI
    if (metric.type === 'bmi') {
        if (typeof value !== 'number') {
            throw new Error('BMI must be a number');
        }
        metric.unit = 'kg/m²';
    }
    
    // Validate temperature
    if (metric.type === 'temperature') {
        if (typeof value !== 'number') {
            throw new Error('Temperature must be a number');
        }
        metric.unit = metric.unit || '°F';
    }
    
    // Validate steps
    if (metric.type === 'steps') {
        if (typeof value !== 'number') {
            throw new Error('Steps must be a number');
        }
        metric.unit = 'steps';
    }
    
    // Validate sleep data
    if (metric.type === 'sleep') {
        if (!value || typeof value !== 'object' || !value.duration) {
            throw new Error('Sleep requires duration');
        }
        metric.unit = 'hours';
    }
    
    // Validate water intake
    if (metric.type === 'water') {
        if (typeof value !== 'number') {
            throw new Error('Water intake must be a number');
        }
        metric.unit = 'glasses';
    }

    // Validate heart rate
    if (metric.type === 'heart-rate') {
        if (typeof value !== 'number' || value < 20 || value > 300) {
            throw new Error('Heart rate must be a number between 20 and 300');
        }
        metric.unit = 'bpm';
    }

    // Validate oxygen saturation
    if (metric.type === 'oxygen') {
        if (typeof value !== 'number' || value < 0 || value > 100) {
            throw new Error('Oxygen saturation must be a number between 0 and 100');
        }
        metric.unit = '%';
    }
});

// Static method to get latest metrics by patient
healthMetricSchema.statics.getLatestMetrics = async function(patientId, types = []) {
    const query = { patient: patientId };
    if (types.length > 0) {
        query.type = { $in: types };
    }
    
    const metrics = await this.find(query)
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
    
    // Group by type and get latest for each
    const latestByType = {};
    metrics.forEach(metric => {
        if (!latestByType[metric.type]) {
            latestByType[metric.type] = metric;
        }
    });
    
    return latestByType;
};

// Static method to get metrics history
healthMetricSchema.statics.getHistory = async function(patientId, type, options = {}) {
    const { startDate, endDate, limit = 30 } = options;
    
    const query = {
        patient: patientId,
        type: type,
    };
    
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

module.exports = mongoose.model('HealthMetric', healthMetricSchema);
