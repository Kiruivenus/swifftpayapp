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
    deviceName: String,
    platform: String,
    ipAddress: String,
    lastActive: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Session = models.Session || model('Session', SessionSchema);

export default Session;
