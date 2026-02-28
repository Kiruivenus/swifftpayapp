import mongoose, { Schema, model, models } from 'mongoose';

const BroadcastDeliverySchema = new Schema({
    broadcastId: {
        type: Schema.Types.ObjectId,
        ref: 'Broadcast',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    channel: {
        type: String,
        enum: ['push', 'email', 'inApp'],
        required: true,
    },
    status: {
        type: String,
        enum: ['QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'FAILED'],
        default: 'QUEUED',
    },
    providerMessageId: String, // FCM/SendGrid ID
    errorCode: String,
    errorMessage: String,
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
}, {
    timestamps: true
});

// Ensure unique delivery per user per broadcast per channel
BroadcastDeliverySchema.index({ broadcastId: 1, userId: 1, channel: 1 }, { unique: true });
BroadcastDeliverySchema.index({ broadcastId: 1, status: 1 });

const BroadcastDelivery = models.BroadcastDelivery || model('BroadcastDelivery', BroadcastDeliverySchema);

export default BroadcastDelivery;
