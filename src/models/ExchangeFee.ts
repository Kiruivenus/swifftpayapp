import mongoose, { Schema, model, models } from 'mongoose';

const ExchangeFeeSchema = new Schema({
    fromCurrency: {
        type: String,
        required: true,
        uppercase: true,
    },
    toCurrency: {
        type: String,
        required: true,
        uppercase: true,
    },
    exchangeFeePercent: {
        type: Number,
        default: 0,
    },
    exchangeFeeFlat: {
        type: Number,
        default: 0,
    },
    networkFee: {
        type: Number,
        default: 0,
    }
}, {
    collection: 'exchange_fees',
    timestamps: true
});

// Ensure unique combination of from/to currency
ExchangeFeeSchema.index({ fromCurrency: 1, toCurrency: 1 }, { unique: true });

const ExchangeFee = models.ExchangeFee || model('ExchangeFee', ExchangeFeeSchema);

export default ExchangeFee;
