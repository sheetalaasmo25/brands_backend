const mongoose = require('mongoose');

/// Updated Brands Schema without comment field
const brandsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        required: true,
    },
    area: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
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
    isActive: {
        type: Boolean,
        default: false,
    },
    selectedPackage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Packages',
        default: null,
    },
    brandsNew: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandsNew',
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
    ratings: [{  // Updated to only include user and rating
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to User model
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
    }],
}, { timestamps: true });

const Brands = mongoose.model('Brands', brandsSchema);
module.exports = Brands;
