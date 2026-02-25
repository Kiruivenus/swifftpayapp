import mongoose, { Schema, model, models } from 'mongoose';

const BlockedUserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        sparse: true,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
    },
    blockedAt: {
        type: Date,
        default: Date.now,
    },
    reason: {
        type: String,
        default: 'ACCOUNT_DELETED',
    }
});

const BlockedUser = models.BlockedUser || model('BlockedUser', BlockedUserSchema);

export default BlockedUser;
