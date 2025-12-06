const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters'],
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
        unique: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    userType: {
        type: String,
        enum: ['user', 'hospital', 'doctor'],
        default: 'user',
    },
    avatar: {
        type: String,
        default: null,
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    bloodGroup: String,
    height: Number,
    weight: Number,
    allergies: [String],
    medicalConditions: [String],
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    refreshToken: String,
}, {
    timestamps: true,
});

// Index for faster queries
userSchema.index({ email: 1, phone: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();
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
