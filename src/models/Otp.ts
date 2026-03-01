import mongoose, { Schema, model, models } from 'mongoose';

const OtpSchema = new Schema({
    identifier: { // email or phone
        type: String,
        required: true,
        index: true,
    },
    code: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['2FA_ENABLE', '2FA_DISABLE', '2FA_LOGIN', 'PASSWORD_RESET', 'PIN_RESET', 'EMAIL_VERIFICATION'],
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // Document auto-deleted after 10 minutes (MongoDB TTL index)
    },
});

const Otp = models.Otp || model('Otp', OtpSchema);

export default Otp;
