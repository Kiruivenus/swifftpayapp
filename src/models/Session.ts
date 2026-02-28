import mongoose, { Schema, model, models } from 'mongoose';

const SessionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    sessionType: {
        type: String,
        enum: ['web', 'mobile'],
        required: true,
        index: true,
    },
    refreshTokenHash: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'revoked', 'expired'],
        default: 'active',
        index: true,
    },
    deviceId: {
        type: String,
        index: true,
    },
    deviceName: String,
    platform: String,
    browser: String,
    appVersion: String,
    ip: String,
    geo: {
        country: String,
        city: String,
        lat: Number,
        lon: Number
    },
    isTrusted: {
        type: Boolean,
        default: false
    },
    trustedAt: Date,
    trustedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin'
    },
    lastSeenAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Session = models.Session || model('Session', SessionSchema);

export default Session;
