import mongoose, { Schema, model, models } from 'mongoose';

const ExchangeRateSchema = new Schema({
    fromCurrency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    toCurrency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    changePercentage: {
        type: Number,
        default: 0,
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
    }
}, {
    collection: 'exchange_rates',
    timestamps: true
});

// Ensure unique pairs
ExchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1 }, { unique: true });

const ExchangeRate = models.ExchangeRate || model('ExchangeRate', ExchangeRateSchema);

export default ExchangeRate;
