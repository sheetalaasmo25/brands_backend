const mongoose = require('mongoose');

const brandsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    landmark: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending',
    },
    isActive: {  // Correct field
        type: Boolean,
        default: false,
    },
    selectedPackage: { // New field to store selected package reference
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Packages', // Reference to Packages collection
        default: null,
    },
    brandsNew: { // New field for brandsNew
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandsNew', // Reference to BrandsNew schema
        default: null,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'store',
    },
}, { timestamps: true });

const Brands = mongoose.model('Brands', brandsSchema);
module.exports = Brands;
