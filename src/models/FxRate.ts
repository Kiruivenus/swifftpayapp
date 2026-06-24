import mongoose, { Schema, model, models } from 'mongoose';

const FxRateSchema = new Schema({
    baseCurrency: {
        type: String, // e.g., 'USDT'
        required: true,
        uppercase: true,
    },
    quoteCurrency: {
        type: String, // e.g., 'KES'
        required: true,
        uppercase: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    previousRate: {
        type: Number,
    },
    changePercentage: {
        type: Number,
        default: 0,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    source: {
        type: String,
        default: 'manual',
    },
    providerName: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    effectiveFrom: {
        type: Date,
        default: Date.now,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    collection: 'fx_rates',
    timestamps: true
});

// Ensure unique pairs
FxRateSchema.index({ baseCurrency: 1, quoteCurrency: 1 }, { unique: true });

const FxRate = models.FxRate || model('FxRate', FxRateSchema);

export default FxRate;
