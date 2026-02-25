import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: String,
    fullName: String,
    phoneNumber: String,
    dob: Date,
    kesBalance: {
        type: Number,
        default: 0,
    },
    usdtBalance: {
        type: Number,
        default: 0,
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER',
    },
    password: {
        type: String,
        required: true,
    },
    pinHash: String,
    isPinSet: {
        type: Boolean,
        default: false,
    },
    biometricEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    usdtAddress: {
        type: String,
        unique: true,
        sparse: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date,
    notificationPrefs: {
        enabled: { type: Boolean, default: true },
        transactions: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['PENDING_VERIFICATION', 'ACTIVE', 'BLOCKED'],
        default: 'PENDING_VERIFICATION',
    },
});

const User = models.User || model('User', UserSchema);

export default User;
