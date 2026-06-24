import mongoose, { Schema, model, models } from 'mongoose';

const ExchangeLimitSchema = new Schema({
    currency: {
        type: String,
        required: true,
        uppercase: true,
        unique: true,
    },
    minLimit: {
        type: Number,
        default: 0,
    },
    maxLimit: {
        type: Number,
        default: 1000000,
    },
    dailyLimit: {
        type: Number,
        default: 5000000,
    }
}, {
    collection: 'exchange_limits',
    timestamps: true
});

const ExchangeLimit = models.ExchangeLimit || model('ExchangeLimit', ExchangeLimitSchema);

export default ExchangeLimit;
