import mongoose, { Schema, model, models } from 'mongoose';

const SessionSchema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    refreshTokenHash: String,
    deviceId: {
        type: String,
        index: true,
    },
    deviceName: String,
    platform: String,
    osVersion: String,
    appVersion: String,
    ipAddress: String,
    isActive: {
        type: Boolean,
        default: true
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
    revokedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Session = models.Session || model('Session', SessionSchema);

export default Session;
