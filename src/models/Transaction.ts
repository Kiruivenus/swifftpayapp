import mongoose, { Schema, model, models } from 'mongoose';

const TransactionSchema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        enum: ['KES', 'USDT'],
        required: true,
    },
    secondaryAmount: Number, // For conversions
    secondaryCurrency: {
        type: String,
        enum: ['KES', 'USDT'],
    },
    type: {
        type: String,
        enum: ['DEPOSIT', 'TRANSFER_SEND', 'TRANSFER_RECEIVE', 'CONVERT'],
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING',
    },
    mpesaReceiptNumber: String,
    phoneNumber: String,
    checkoutRequestID: {
        type: String,
        index: true,
    },
    recipientId: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Transaction = models.Transaction || model('Transaction', TransactionSchema);

export default Transaction;
