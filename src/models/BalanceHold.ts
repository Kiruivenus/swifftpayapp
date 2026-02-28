import mongoose, { Schema, model, models } from 'mongoose';

const BalanceHoldSchema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    currency: {
        type: String,
        enum: ['KES', 'USDT'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'RELEASED'],
        default: 'ACTIVE',
        index: true,
    },
    referenceId: String, // Optional ticket/report ID
    createdByAdminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: -1,
    },
    releasedAt: Date,
    releaseReason: String,
    releasedByAdminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
});

const BalanceHold = models.BalanceHold || model('BalanceHold', BalanceHoldSchema);

export default BalanceHold;
