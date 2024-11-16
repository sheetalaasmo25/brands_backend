const mongoose = require('mongoose');

const CenterbannerSchema = new mongoose.Schema({
    bannerName: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const CenterBanner = mongoose.model('CenterBanner', CenterbannerSchema);

module.exports = CenterBanner;
