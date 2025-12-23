const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'patient'],
        required: [true, 'Role is required'],
    },
    // Admin specific fields
    department: {
        type: String,
        required: function () { return this.role === 'admin'; },
    },
    // Doctor specific fields
    specialization: {
        type: String,
        required: function () { return this.role === 'doctor'; },
    },
    qualification: {
        type: String,
        required: function () { return this.role === 'doctor'; },
    },
    experience: {
        type: Number,
        required: function () { return this.role === 'doctor'; },
    },
    consultationFee: {
        type: Number,
        required: function () { return this.role === 'doctor'; },
    },
    // Patient specific fields
    dateOfBirth: {
        type: Date,
        required: function () { return this.role === 'patient'; },
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: function () { return this.role === 'patient'; },
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    address: String,
    emergencyContact: {
        name: String,
        phone: String,
        relation: String,
    },
    medicalHistory: [{
        condition: String,
        diagnosedDate: Date,
        status: {
            type: String,
            enum: ['active', 'resolved', 'chronic'],
            default: 'active',
        },
    }],
    allergies: [String],
    currentMedications: [String],
    // Common fields
    avatar: String,
    isActive: {
        type: Boolean,
        default: true,
    },
    tokenVersion: {
        type: Number,
        default: 0, // Increment on logout to invalidate all tokens
    },
    revokedTokens: [{
        token: String,
        revokedAt: Date,
    }],
    isVerified: {
        type: Boolean,
        default: false,
    },
    refreshToken: String,
    lastLogin: Date,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for age calculation
userSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Indexes for faster queries (userId and email already indexed via unique: true)
userSchema.index({ role: 1 });
userSchema.index({ userId: 1, role: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON response
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.__v;
    return user;
};

module.exports = mongoose.model('User', userSchema);
