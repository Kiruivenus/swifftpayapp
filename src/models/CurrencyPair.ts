import mongoose, { Schema, model, models } from 'mongoose';

const CurrencyPairSchema = new Schema({
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
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    collection: 'currency_pairs',
    timestamps: true
});

// Ensure unique combination of from/to currency
CurrencyPairSchema.index({ fromCurrency: 1, toCurrency: 1 }, { unique: true });

const CurrencyPair = models.CurrencyPair || model('CurrencyPair', CurrencyPairSchema);

export default CurrencyPair;
