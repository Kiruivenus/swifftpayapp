import mongoose, { Schema, model, models } from 'mongoose';

const UserNotificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['BROADCAST', 'SYSTEM', 'SECURITY', 'FINANCE'],
        default: 'SYSTEM',
    },
    refId: String, // broadcastId/txId/etc
    read: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});

UserNotificationSchema.index({ userId: 1, createdAt: -1 });

const UserNotification = models.UserNotification || model('UserNotification', UserNotificationSchema);

export default UserNotification;
