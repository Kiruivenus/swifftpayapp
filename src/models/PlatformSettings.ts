import mongoose, { Schema, model, models } from 'mongoose';

const PlatformSettingsSchema = new Schema({
    // General
    platformName: { type: String, default: 'SwiftPay' },
    supportEmail: { type: String, default: 'support@swiftpay.ke' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'System is currently undergoing scheduled maintenance. Please check back later.' },

    // Brand Assets
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },

    // Integrations (Encrypted)
    mpesaConsumerKey: { type: String, default: '' },
    mpesaConsumerSecret: { type: String, default: '' },
    mpesaPasskey: { type: String, default: '' },
    mpesaShortCode: { type: String, default: '' },
    mpesaEnvironment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
    callbackBaseUrl: { type: String, default: '' },

    sendgridApiKey: { type: String, default: '' },

    // SMTP (Encrypted)
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    smtpFrom: { type: String, default: '' },

    // Security & Policy
    sessionTTLMinutes: { type: Number, default: 60 },
    maxLoginAttempts: { type: Number, default: 5 },
    kycRequired: { type: Boolean, default: true },
    withdrawalRequiresKyc: { type: Boolean, default: true },

    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String } // Admin User ID
}, {
    timestamps: true
});

// Singleton helper to ensure only one settings document exists
PlatformSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const PlatformSettings = models.PlatformSettings || model('PlatformSettings', PlatformSettingsSchema);

export default PlatformSettings;
