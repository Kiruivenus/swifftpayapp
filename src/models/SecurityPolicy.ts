import mongoose, { Schema, model, models } from 'mongoose';

const SecurityPolicySchema = new Schema({
    mandatory2faForAdmins: {
        type: Boolean,
        default: false,
    },
    enforce2faAllUsers: {
        type: Boolean,
        default: false,
    },
    blockNonKenyanIps: {
        type: Boolean,
        default: false,
    },
    allowedCountries: {
        type: [String],
        default: ['KE'],
    },
    ipWhitelist: {
        type: [String],
        default: [],
    },
    ipBlacklist: {
        type: [String],
        default: [],
    },
    deviceRestrictionsEnabled: {
        type: Boolean,
        default: false,
    },
    sessionMaxAgeHours: {
        type: Number,
        default: 8,
    },
    maxFailedLogins: {
        type: Number,
        default: 5,
    },
    lockoutMinutes: {
        type: Number,
        default: 15,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
});

// Singleton helper
SecurityPolicySchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const SecurityPolicy = models.SecurityPolicy || model('SecurityPolicy', SecurityPolicySchema);

export default SecurityPolicy;
