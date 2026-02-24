import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: String,
    phoneNumber: String,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = models.User || model('User', UserSchema);

export default User;
