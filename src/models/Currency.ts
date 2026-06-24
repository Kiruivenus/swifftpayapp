import mongoose, { Schema, model, models } from 'mongoose';

const CurrencySchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    name: {
        type: String,
        required: true,
    },
    symbol: {
        type: String,
        required: true,
    },
    precision: {
        type: Number,
        default: 2,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    conversionRules: {
        minLimit: { type: Number, default: 0 },
        maxLimit: { type: Number, default: 1000000 },
        autoSync: { type: Boolean, default: true },
    }
}, {
    collection: 'currencies',
    timestamps: true
});

const Currency = models.Currency || model('Currency', CurrencySchema);

export default Currency;
