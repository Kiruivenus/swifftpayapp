import mongoose, { Schema, model, models } from 'mongoose';

const AdminLogSchema = new Schema({
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    targetType: {
        type: String,
        enum: ['USER', 'TRANSACTION', 'KYC', 'SETTING', 'RATE'],
        required: true,
    },
    targetId: String,
    details: Schema.Types.Mixed,
    ipAddress: String,
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const AdminLog = models.AdminLog || model('AdminLog', AdminLogSchema);

export default AdminLog;
