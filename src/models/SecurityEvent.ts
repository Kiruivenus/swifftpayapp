import mongoose, { Schema, model, models } from 'mongoose';

const SecurityEventSchema = new Schema({
    type: {
        type: String,
        enum: [
            'FAILED_LOGIN',
            'NEW_DEVICE',
            'PASSWORD_RESET',
            'ADMIN_ROLE_CHANGED',
            'SUSPICIOUS_LOGIN',
            'SESSION_REVOKED',
            'SENSITIVE_ACTION',
            'SUSPICIOUS_WITHDRAW',
            'ACCOUNT_LOCKOUT',
            'SECURITY_POLICY_CHANGED',
            'EMERGENCY_LOCK'
        ],
        required: true,
        index: true,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Admin are also Users with role ADMIN/SUPER_ADMIN
        index: true,
    },
    sessionId: {
        type: Schema.Types.ObjectId,
        ref: 'Session',
    },
    ip: String,
    geo: {
        country: String,
        city: String
    },
    userAgent: String,
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['NEW', 'INVESTIGATING', 'RESOLVED', 'ESCALATED'],
        default: 'NEW',
        index: true,
    },
    resolutionNotes: {
        type: String,
        default: '',
    },
    resolvedAt: {
        type: Date,
        default: null,
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Auto-expire events after 90 days to save space
SecurityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const SecurityEvent = models.SecurityEvent || model('SecurityEvent', SecurityEventSchema);

export default SecurityEvent;
