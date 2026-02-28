import mongoose, { Schema, model, models } from 'mongoose';

const RegionSchema = new Schema({
    countryName: {
        type: String,
        required: true,
        unique: true,
    },
    countryCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    currencyCode: {
        type: String,
        required: true,
        default: 'KES',
    },
    phonePrefix: {
        type: String,
        required: true,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    defaultForNewUsers: {
        type: Boolean,
        default: false,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    collection: 'regions',
    timestamps: true
});

const Region = models.Region || model('Region', RegionSchema);

export default Region;
