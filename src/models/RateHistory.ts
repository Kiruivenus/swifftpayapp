import mongoose, { Schema, model, models } from 'mongoose';

const RateHistorySchema = new Schema({
    type: {
        type: String, // e.g., 'fx_rate', 'fees_limits', 'region', 'freeze'
        required: true,
        enum: ['fx_rate', 'fees_limits', 'region', 'freeze'],
    },
    before: {
        type: Schema.Types.Mixed,
    },
    after: {
        type: Schema.Types.Mixed,
    },
    changedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    ip: {
        type: String,
    },
    userAgent: {
        type: String,
    },
}, {
    collection: 'rate_history',
    timestamps: false
});

const RateHistory = models.RateHistory || model('RateHistory', RateHistorySchema);

export default RateHistory;
