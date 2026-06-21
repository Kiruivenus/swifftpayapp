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
        enum: ['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENCE', 'PROOF_OF_ADDRESS'],
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
    proofOfAddressUrl: String,
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'RESUBMISSION_REQUESTED'],
        default: 'PENDING',
    },
    rejectionReason: String,
    internalNotes: String,
    aiChecks: {
        isBlurry: { type: Boolean, default: false },
        isDuplicate: { type: Boolean, default: false },
        isEdited: { type: Boolean, default: false },
        isExpired: { type: Boolean, default: false },
        dataMismatch: { type: Boolean, default: false },
        riskScore: { type: Number, default: 0 },
        faceMatchConfidence: { type: Number, default: 0 }
    },
    auditTrail: [{
        reviewerName: String,
        reviewerRole: String,
        action: String,
        timestamp: { type: Date, default: Date.now },
        notes: String
    }],
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
