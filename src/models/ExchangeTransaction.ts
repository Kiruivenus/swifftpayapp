import mongoose, { Schema, model, models } from 'mongoose';

const ExchangeTransactionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
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
    fromAmount: {
        type: Number,
        required: true,
    },
    toAmount: {
        type: Number,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    exchangeFee: {
        type: Number,
        default: 0,
    },
    networkFee: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'PENDING'],
        default: 'SUCCESS',
    },
    referenceId: {
        type: String,
        required: true,
        unique: true,
    },
    txId: {
        type: String,
        required: true,
        unique: true,
    }
}, {
    collection: 'exchange_transactions',
    timestamps: true
});

const ExchangeTransaction = models.ExchangeTransaction || model('ExchangeTransaction', ExchangeTransactionSchema);

export default ExchangeTransaction;
