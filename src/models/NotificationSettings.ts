import mongoose, { Schema, model, models } from 'mongoose';

const NotificationSettingsSchema = new Schema({
    newLoginDetected: {
        type: Boolean,
        default: true,
    },
    kycStatusUpdates: {
        type: Boolean,
        default: true,
    },
    depositSuccessful: {
        type: Boolean,
        default: true,
    },
    withdrawalProcessed: {
        type: Boolean,
        default: true,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
}, {
    timestamps: true,
    collection: 'notification_settings'
});

// Helper for singleton behavior
NotificationSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const NotificationSettings = models.NotificationSettings || model('NotificationSettings', NotificationSettingsSchema);

export default NotificationSettings;
