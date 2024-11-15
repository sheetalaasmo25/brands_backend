// models/Deal.js
const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    discountAmount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    dealPrice: {
        type: Number,
        required: true,
    },
    originalPrice: {
        type: Number,
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
    brands: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brands',
        required: true,
    }],
}, { timestamps: true });

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;
