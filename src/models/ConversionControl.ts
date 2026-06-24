import mongoose, { Schema, model, models } from 'mongoose';

const ConversionControlSchema = new Schema({
    conversionsFrozen: {
        type: Boolean,
        default: false,
    },
    depositsFrozen: {
        type: Boolean,
        default: false,
    },
    withdrawalsFrozen: {
        type: Boolean,
        default: false,
    },
    disabledRegions: {
        type: [String],
        default: [],
    },
    disabledCurrencies: {
        type: [String],
        default: [],
    },
    freezeReason: {
        type: String,
        default: '',
    },
    frozenBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    frozenAt: {
        type: Date,
        default: Date.now,
    },
}, {
    collection: 'conversion_controls',
    timestamps: true
});

// Singleton Pattern
ConversionControlSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const ConversionControl = models.ConversionControl || model('ConversionControl', ConversionControlSchema);

export default ConversionControl;
