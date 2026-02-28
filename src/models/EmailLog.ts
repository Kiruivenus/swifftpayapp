import mongoose, { Schema, model, models } from 'mongoose';

const EmailLogSchema = new Schema({
    to: {
        type: String,
        required: true,
        index: true,
    },
    subject: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', '2FA_CODE', 'NOTIFICATION', 'SECURITY_ALERT'],
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['SENT', 'FAILED'],
        required: true,
        index: true,
    },
    error: {
        type: String,
    },
    attempts: {
        type: Number,
        default: 1,
    },
    metadata: {
        type: Schema.Types.Mixed,
    },
    sentAt: {
        type: Date,
        default: Date.now,
        index: true,
    }
}, {
    timestamps: false
});

const EmailLog = models.EmailLog || model('EmailLog', EmailLogSchema);

export default EmailLog;
