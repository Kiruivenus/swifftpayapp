import mongoose, { Schema, model, models } from 'mongoose';

const PlatformSettingsSchema = new Schema({
    // General
    platformName: { type: String, default: 'SwiftPay' },
    supportEmail: { type: String, default: 'support@swiftpay.ke' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'System is currently undergoing scheduled maintenance. Please check back later.' },

    // System Status Toggles
    registrationEnabled: { type: Boolean, default: true },
    depositsEnabled: { type: Boolean, default: true },
    withdrawalsEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true },

    // Brand Assets
    logoUrl: { type: String, default: '' },
    logoDashboardUrl: { type: String, default: '' },
    logoMobileUrl: { type: String, default: '' },
    logoEmailUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    notificationIconUrl: { type: String, default: '' },

    brandColors: {
        primary: { type: String, default: '#FF6B00' },
        secondary: { type: String, default: '#0D1017' },
        darkBase: { type: String, default: '#050816' },
        cardBg: { type: String, default: '#0D1017' }
    },
    typography: { type: String, default: 'Outfit' },

    // Integrations (Encrypted)
    mpesaConsumerKey: { type: String, default: '' },
    mpesaConsumerSecret: { type: String, default: '' },
    mpesaPasskey: { type: String, default: '' },
    mpesaShortCode: { type: String, default: '' },
    mpesaEnvironment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
    callbackBaseUrl: { type: String, default: '' },

    preferredEmailProvider: { type: String, enum: ['smtp', 'resend', 'sendgrid', 'mailgun', 'ses'], default: 'smtp' },
    sendgridApiKey: { type: String, default: '' },
    resendApiKey: { type: String, default: '' },
    mailgunApiKey: { type: String, default: '' },
    mailgunDomain: { type: String, default: '' },
    sesAccessKeyId: { type: String, default: '' },
    sesSecretAccessKey: { type: String, default: '' },
    sesRegion: { type: String, default: 'us-east-1' },

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

    // Referral Program Settings
    referralEnabled: { type: Boolean, default: true },
    referralMinRewardUsd: { type: Number, default: 2.00 },
    referralMaxRewardUsd: { type: Number, default: 10.00 },
    referralCardSpendRequirementUsd: { type: Number, default: 5.00 },
    referralCardSpendDaysLimit: { type: Number, default: 14 },
    referralDepositRequirementUsd: { type: Number, default: 100.00 },

    // Gateways Enable Switches
    gatewaysEnabled: {
        mpesa: { type: Boolean, default: true },
        paypal: { type: Boolean, default: false },
        stripe: { type: Boolean, default: false },
        crypto: { type: Boolean, default: false },
        bank: { type: Boolean, default: false }
    },

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
