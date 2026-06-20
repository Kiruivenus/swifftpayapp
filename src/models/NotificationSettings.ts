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
    failedLoginAttempts: {
        type: Boolean,
        default: true,
    },
    passwordChanged: {
        type: Boolean,
        default: true,
    },
    newDeviceLogin: {
        type: Boolean,
        default: true,
    },
    withdrawalRejected: {
        type: Boolean,
        default: true,
    },
    depositFailed: {
        type: Boolean,
        default: true,
    },
    kycSubmitted: {
        type: Boolean,
        default: true,
    },
    kycApproved: {
        type: Boolean,
        default: true,
    },
    kycRejected: {
        type: Boolean,
        default: true,
    },
    referralReward: {
        type: Boolean,
        default: true,
    },
    accountSuspended: {
        type: Boolean,
        default: true,
    },
    maintenanceAlerts: {
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
