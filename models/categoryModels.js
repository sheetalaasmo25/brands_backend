const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true,
    },
    images: {
        type: [String],
        required: true, // URL or path to the image
    },
    description: {
        type: String,
        required: true,
 },
//  brands: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Brands',
//     required: true,
// }],
}, { timestamps: true });

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;
