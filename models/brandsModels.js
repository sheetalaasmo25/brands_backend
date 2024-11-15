const mongoose = require('mongoose');

const brandsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        required: true, // URL or path to the image
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
        unique: true, // Ensure unique email
    },
    status: {
        type: String,
        enum: ['pending', 'approved'], // Enum values for status
        default: 'pending',  // Default value is 'pending'
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
