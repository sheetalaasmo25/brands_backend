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
    pincode: {
        type: Number,
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
    package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Packages',
        default: null,
    },
    packageAmount:{
        type: Number,
        required: true,
    },
    productCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }], 
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
    count: {
        type: Number,
        default: 0, // Starting count
    },

    countHistory: [{
        date: {
            type: Date,
            required: true,
        },
        countIncremented: {
            type: Number,
            required: true,
        },
    }],
}, { timestamps: true });

const Brands = mongoose.model('Brands', brandsSchema);
module.exports = Brands;
