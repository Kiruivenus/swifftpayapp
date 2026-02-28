import mongoose, { Schema, model, models } from 'mongoose';

const BroadcastSchema = new Schema({
    createdByAdminId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Assuming Admin is a User with a role
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    targetAudience: {
        scope: {
            type: String,
            enum: ['ALL_USERS', 'VERIFIED_ONLY', 'UNVERIFIED_ONLY', 'KYC_PENDING', 'KYC_APPROVED', 'KYC_REJECTED', 'COUNTRY', 'CUSTOM_QUERY'],
            default: 'ALL_USERS',
        },
        countries: [String],
        userIds: [String],
    },
    channels: {
        push: { type: Boolean, default: false },
        email: { type: Boolean, default: false },
        inApp: { type: Boolean, default: true },
    },
    status: {
        type: String,
        enum: ['DRAFT', 'QUEUED', 'SENDING', 'SENT', 'FAILED', 'PARTIAL'],
        default: 'DRAFT',
    },
    scheduledAt: Date,
    sentAt: Date,
    stats: {
        targeted: { type: Number, default: 0 },
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
    }
}, {
    timestamps: true
});

BroadcastSchema.index({ createdAt: -1 });
BroadcastSchema.index({ status: 1, scheduledAt: 1 });

const Broadcast = models.Broadcast || model('Broadcast', BroadcastSchema);

export default Broadcast;
