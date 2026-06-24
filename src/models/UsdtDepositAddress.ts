import mongoose, { Schema, model, models } from 'mongoose';

const UsdtDepositAddressSchema = new Schema({
    address: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    network: {
        type: String,
        default: 'TRC20',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const UsdtDepositAddress = models.UsdtDepositAddress || model('UsdtDepositAddress', UsdtDepositAddressSchema);

export default UsdtDepositAddress;
