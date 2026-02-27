import mongoose, { Schema, model, models } from 'mongoose';

const KycRequestSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fullName: String,
    dob: Date,
    nationality: String,
    documentType: {
        type: String,
        enum: ['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENCE'],
        required: true,
    },
    documentNumber: {
        type: String,
        required: true,
    },
    frontImageUrl: {
        type: String,
        required: true,
    },
    backImageUrl: String,
    selfieImageUrl: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
    },
    rejectionReason: String,
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    reviewedAt: Date,
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
});

const KycRequest = models.KycRequest || model('KycRequest', KycRequestSchema);

export default KycRequest;
