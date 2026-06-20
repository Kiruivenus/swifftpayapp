import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: String,
    fullName: String,
    phoneNumber: String,
    dob: Date,
    kesBalance: {
        type: Number,
        default: 0,
    },
    usdtBalance: {
        type: Number,
        default: 0,
    },
    role: {
        type: String,
        enum: ['user', 'super_admin', 'admin', 'finance', 'kyc_reviewer', 'support'],
        lowercase: true,
        default: 'user',
    },
    walletId: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
    },
    password: {
        type: String,
        required: true,
    },
    pinHash: String,
    isPinSet: {
        type: Boolean,
        default: false,
    },
    pinCreatedAt: Date,
    biometricEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    email2FAEnabled: {
        type: Boolean,
        default: true,
    },
    usdtAddress: {
        type: String,
        unique: true,
        sparse: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date,
    notificationPrefs: {
        enabled: { type: Boolean, default: true },
        transactions: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['PENDING_VERIFICATION', 'ACTIVE', 'BLOCKED'],
        default: 'PENDING_VERIFICATION',
    },
    emailNormalized: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
    },
    usernameNormalized: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
    },
    phoneE164: {
        type: String,
        unique: true,
        required: true,
    },
    countryCode: String,
    currency: String,
    kycStatus: {
        type: String,
        enum: ['NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED'],
        default: 'NOT_STARTED',
    },
    kycRejectionReason: String,
    nationalityCode: String,
    nationalityName: String,
    residentialAddress: String,
    profilePhotoUrl: String,
    userSettings: {
        hideBalances: { type: Boolean, default: false },
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true,
    },
    referredBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
});

// Pre-validation hook to ensure normalized fields are populated
UserSchema.pre('validate', async function () {
    if (this.email) {
        this.emailNormalized = this.email.trim().toLowerCase();
    }
    if (this.username) {
        this.usernameNormalized = this.username.trim().toLowerCase();
    }
    if (!this.referralCode) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.referralCode = code;
    }
});

const User = models.User || model('User', UserSchema);

export default User;
