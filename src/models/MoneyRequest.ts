import mongoose, { Schema, model, models } from 'mongoose';

const MoneyRequestSchema = new Schema({
    requesterId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    payerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
    reason: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
        default: 'PENDING',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const MoneyRequest = models.MoneyRequest || model('MoneyRequest', MoneyRequestSchema);
export default MoneyRequest;
