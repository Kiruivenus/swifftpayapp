import mongoose, { Schema, model, models } from 'mongoose';

const NotificationTokenSchema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    deviceId: {
        type: String,
        required: true,
    },
    fcmToken: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        enum: ['android', 'ios', 'web'],
        default: 'android',
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    }
});

// Compound index to ensure one token per user+device
NotificationTokenSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const NotificationToken = models.NotificationToken || model('NotificationToken', NotificationTokenSchema);

export default NotificationToken;
