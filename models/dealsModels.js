const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    couponCode: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive',
    },
    isShow: {
        type: Boolean,
        default: false,
    },
    isWishlist: { // Corrected the typo here
        type: Boolean,
        default: false,
    },
    store: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brands',
        required: true,
    }],
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    }],
    brands: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandsNew',
        required: true,
    }],
    wishlistUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

}, { timestamps: true });

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;
