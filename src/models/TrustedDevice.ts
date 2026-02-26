import mongoose, { Schema, model, models } from 'mongoose';

const TrustedDeviceSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
    },
    deviceName: String,
    platform: String,
    lastUsedAt: {
        type: Date,
        default: Date.now,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Compound index for quick lookup
TrustedDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const TrustedDevice = models.TrustedDevice || model('TrustedDevice', TrustedDeviceSchema);

export default TrustedDevice;
