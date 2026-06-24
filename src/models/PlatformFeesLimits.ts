import mongoose, { Schema, model, models } from 'mongoose';

const FeeConfigSchema = new Schema({
    type: {
        type: String,
        enum: ['percentage', 'fixed', 'tiered'],
        default: 'percentage',
    },
    value: {
        type: Number,
        default: 0,
    },
    tiers: [{
        limit: { type: Number, required: true },
        fee: { type: Number, required: true }
    }]
}, { _id: false });

const PlatformFeesLimitsSchema = new Schema({
    // Legacy Fields (For backwards compatibility)
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

    // Expanded Multi-mode Fee Structures
    depositFee: {
        type: FeeConfigSchema,
        default: () => ({ type: 'percentage', value: 0, tiers: [] }),
    },
    withdrawalFee: {
        type: FeeConfigSchema,
        default: () => ({ type: 'percentage', value: 1.0, tiers: [] }),
    },
    transferFee: {
        type: FeeConfigSchema,
        default: () => ({ type: 'percentage', value: 0.1, tiers: [] }),
    },
    conversionFee: {
        type: FeeConfigSchema,
        default: () => ({ type: 'percentage', value: 0.5, tiers: [] }),
    },
    networkFee: {
        type: FeeConfigSchema,
        default: () => ({ type: 'fixed', value: 1.0, tiers: [] }),
    },
    regionalFees: {
        type: Map,
        of: Number,
        default: {},
    },

    minDepositByCurrency: {
        type: Map,
        of: Number,
        default: { 'KES': 100, 'USDT': 1 },
    },
    minWithdrawByCurrency: {
        type: Map,
        of: Number,
        default: { 'KES': 10, 'USDT': 10 },
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
