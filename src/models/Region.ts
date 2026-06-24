import mongoose, { Schema, model, models } from 'mongoose';

const RegionSchema = new Schema({
    countryName: {
        type: String,
        required: true,
        unique: true,
    },
    countryCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    currencyCode: {
        type: String,
        required: true,
        default: 'KES',
    },
    phonePrefix: {
        type: String,
        required: true,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: ['ENABLED', 'DISABLED', 'MAINTENANCE', 'RESTRICTED'],
        default: 'ENABLED',
    },
    operationalHealth: {
        type: String,
        enum: ['HEALTHY', 'DEGRADED', 'OUTAGE'],
        default: 'HEALTHY',
    },
    paymentMethods: {
        type: [String],
        default: ['Mobile Money', 'Bank Transfer'],
    },
    withdrawalMethods: {
        type: [String],
        default: ['Mobile Money', 'Bank Transfer'],
    },
    kycRequirements: {
        type: [String],
        default: ['Level 1 - Identity'],
    },
    taxRules: {
        withholdingTaxPercent: { type: Number, default: 0 },
        vatPercent: { type: Number, default: 0 },
    },
    limits: {
        dailyMax: { type: Number, default: 100000 },
        lifetimeMax: { type: Number, default: 1000000 },
    },
    defaultForNewUsers: {
        type: Boolean,
        default: false,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    collection: 'regions',
    timestamps: true
});

const Region = models.Region || model('Region', RegionSchema);

export default Region;
