import mongoose, { Schema, model, models } from 'mongoose';
import bcrypt from 'bcryptjs';

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
        enum: ['2FA_ENABLE', '2FA_DISABLE', '2FA_LOGIN', 'PASSWORD_RESET', 'PIN_RESET'],
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // Document expires in 10 minutes
    },
});

OtpSchema.pre('save', async function () {
    if (this.isModified('code')) {
        this.code = await bcrypt.hash(this.code, 10);
    }
});

const Otp = models.Otp || model('Otp', OtpSchema);

export default Otp;
