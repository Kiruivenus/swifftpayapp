import mongoose, { Schema, model, models } from 'mongoose';

const WalletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    kesBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
    usdtBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
    balances: {
        type: Map,
        of: Number,
        default: {},
    },
    lockedKES: {
        type: Number,
        default: 0,
        min: 0,
    },
    lockedUSDT: {
        type: Number,
        default: 0,
        min: 0,
    },
    usdtAddress: {
        type: String,
        unique: true,
        sparse: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

const Wallet = models.Wallet || model('Wallet', WalletSchema);

export default Wallet;
