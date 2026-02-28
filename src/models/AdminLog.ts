import mongoose, { Schema, model, models } from 'mongoose';

const AdminLogSchema = new Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        index: -1,
    },
    actorType: {
        type: String,
        enum: ['ADMIN', 'SYSTEM'],
        default: 'ADMIN',
    },
    actorId: {
        type: String,
        index: true,
    },
    actorName: String,
    actorRole: String,
    actionType: {
        type: String,
        required: true,
        index: true,
    },
    targetType: {
        type: String,
        required: true,
        index: true,
    },
    targetId: {
        type: String,
        index: true,
    },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'CRITICAL'],
        default: 'INFO',
    },
    details: {
        type: Schema.Types.Mixed,
        default: {},
    },
    ipAddress: String,
    userAgent: String,
    requestId: String,
    hash: String,
    prevHash: String,
});

// Text index for search
AdminLogSchema.index({
    actorName: 'text',
    targetId: 'text',
    ipAddress: 'text',
    'details.reason': 'text'
});

const AdminLog = models.AdminLog || model('AdminLog', AdminLogSchema);

export default AdminLog;
