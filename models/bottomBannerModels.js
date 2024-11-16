const mongoose = require('mongoose');

const BottombannerSchema = new mongoose.Schema({
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

const BottomBanner = mongoose.model('BottomBanner', BottombannerSchema);

module.exports = BottomBanner;
