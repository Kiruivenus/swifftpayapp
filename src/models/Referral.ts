import mongoose, { Schema, model, models } from 'mongoose';

const ReferralSchema = new Schema({
    referrerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    referredUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING',
        required: true,
    },
    rewardAmount: {
        type: Number,
        default: 0,
    },
    currency: {
        type: String,
        default: 'USDT',
    },
    cardSpent: {
        type: Boolean,
        default: false,
    },
    deposited: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    completedAt: Date,
});

const Referral = models.Referral || model('Referral', ReferralSchema);

export default Referral;
