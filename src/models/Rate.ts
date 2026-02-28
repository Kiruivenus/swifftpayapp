import mongoose, { Schema, model, models } from 'mongoose';

const RateSchema = new Schema({
    pair: {
        type: String, // e.g., 'USDT/KES'
        required: true,
        unique: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    spread: {
        type: Number,
        default: 0,
    },
    trend: {
        type: String,
        enum: ['up', 'down', 'stable'],
        default: 'stable',
    },
    percentChange: {
        type: String,
        default: '0.00%',
    },
    isLiveSync: {
        type: Boolean,
        default: true,
    },
    isEmergencyLocked: {
        type: Boolean,
        default: false,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Rate = models.Rate || model('Rate', RateSchema);

export default Rate;
