import mongoose, { Schema, model, models } from 'mongoose';

const TransactionSchema = new Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User',
        index: true,
    },
    senderId: {
        type: String,
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
        enum: ['DEPOSIT', 'TRANSFER_SEND', 'TRANSFER_RECEIVE', 'CONVERT', 'WITHDRAW'],
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'HOLD', 'ESCALATED', 'REVERSED'],
        default: 'PENDING',
    },
    mpesaReceiptNumber: String,
    phoneNumber: String,
    checkoutRequestID: {
        type: String,
        index: true,
    },
    recipientId: String,
    toAddress: String, // For on-chain withdrawals
    network: String, // e.g., 'TRC20'
    fee: Number,
    netAmount: Number,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    processedAt: Date,
    processedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    rejectionReason: String,
    isFlagged: {
        type: Boolean,
        default: false,
        index: true,
    },
    flagReason: String,
});

const Transaction = models.Transaction || model('Transaction', TransactionSchema);

export default Transaction;
