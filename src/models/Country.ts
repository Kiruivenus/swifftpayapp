import mongoose, { Schema, model, models } from 'mongoose';

const CountrySchema = new Schema({
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
    phoneCode: {
        type: String,
        required: true,
    },
    allowedCurrencies: {
        type: [String],
        default: ['KES'],
    },
    defaultCurrency: {
        type: String,
        default: 'KES',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Country = models.Country || model('Country', CountrySchema);

export default Country;
