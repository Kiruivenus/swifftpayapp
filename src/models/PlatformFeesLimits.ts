import mongoose, { Schema, model, models } from 'mongoose';

const PlatformFeesLimitsSchema = new Schema({
    withdrawalFeePercent: {
        type: Number,
        default: 1.0, // 1%
    },
    conversionSpreadPercent: {
        type: Number,
        default: 0.5, // 0.5%
    },
    networkFeeUsdtFlat: {
        type: Number,
        default: 1.0, // $1.00
    },
    minDepositByCurrency: {
        type: Map,
        of: Number,
        default: { 'KES': 100, 'USDT': 1 },
    },
    minWithdrawByCurrency: {
        type: Map,
        of: Number,
        default: { 'KES': 500, 'USDT': 5 },
    },
    dailyLimitVerifiedByCurrency: {
        type: Map,
        of: Number,
        default: { 'KES': 500000, 'USDT': 5000 },
    },
    dailyLimitUnverifiedByCurrency: {
        type: Map,
        of: Number,
        default: { 'KES': 50000, 'USDT': 500 },
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    collection: 'platform_fees_limits',
    timestamps: true
});

// Singleton Pattern
PlatformFeesLimitsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const PlatformFeesLimits = models.PlatformFeesLimits || model('PlatformFeesLimits', PlatformFeesLimitsSchema);

export default PlatformFeesLimits;
