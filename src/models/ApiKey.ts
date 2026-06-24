import mongoose, { Schema, model, models } from 'mongoose';

const ApiKeySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
        unique: true,
    },
    secretPrefix: {
        type: String,
        required: true,
    },
    scopes: {
        type: [String],
        default: ['read', 'write'],
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'REVOKED'],
        default: 'ACTIVE',
    },
    rateLimit: {
        type: Number,
        default: 100, // requests per minute
    },
    lastUsedAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, {
    collection: 'api_keys',
    timestamps: true
});

const ApiKey = models.ApiKey || model('ApiKey', ApiKeySchema);

export default ApiKey;
