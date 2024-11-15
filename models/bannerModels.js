const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
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

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
