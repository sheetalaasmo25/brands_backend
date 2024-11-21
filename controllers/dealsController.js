const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Deal = require('../models/dealsModels');
require('dotenv').config();

// Configure S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Helper function to upload a single image to S3
async function uploadImageToS3(file) {
    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `deals/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
}

// Add a new deal
const addDeal = async (req, res) => {
    const { title, store, description, startDate, endDate, brands, category, couponCode } = req.body;
    const file = req.file;

    if (!title || !description || !startDate || !endDate || !brands || !store || !file) {
        return res.status(400).json({ msg: 'All fields are required: title, description, startDate, endDate, store, brands, and an image.' });
    }

    try {
        // Upload image to S3
        const imageUrl = await uploadImageToS3(file);

        // Create and save new deal
        const deal = new Deal({
            title,
            store,
            description,
            startDate,
            endDate,
            brands,
            category,
            couponCode,
            image: imageUrl,
        });

        await deal.save();
        res.status(201).json({ msg: 'Deal added successfully', deal });
    } catch (error) {
        res.status(500).json({ msg: 'Error adding deal', error });
    }
};

// Get all deals with pagination and search
const getAllDeals = async (req, res) => {
    const { page = 1, limit = 10, searchTerm = "" } = req.query;

    try {
        const filter = searchTerm ? {
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
            ],
        } : {};

        const totalDeals = await Deal.countDocuments(filter);
        const deals = await Deal.find(filter)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('brands')
            .populate('store')
            .populate('category');

        res.status(200).json({
            totalDeals,
            totalPages: Math.ceil(totalDeals / limit),
            currentPage: Number(page),
            deals,
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching deals', error });
    }
};

// Get own deals for a specific store
const getAllOwnDeals = async (req, res) => {
    const userId = req.user.id;

    try {
        const deals = await Deal.find({ store: userId })
            .populate('brands')
            .populate('store')
            .populate('category');

        if (!deals.length) {
            return res.status(404).json({ msg: 'No deals found for this store' });
        }

        res.status(200).json({ deals });
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching deals', error });
    }
};

// Get a deal by ID
const getDealById = async (req, res) => {
    const { id } = req.params;

    try {
        const deal = await Deal.findById(id)
            .populate('brands')
            .populate('store')
            .populate('category');

        if (!deal) {
            return res.status(404).json({ msg: 'Deal not found' });
        }

        res.status(200).json(deal);
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching deal', error });
    }
};

// Update a deal by ID
const updateDeal = async (req, res) => {
    const { id } = req.params;
    const { title, store, description, startDate, endDate, brands, category, couponCode } = req.body;
    const file = req.file;

    try {
        const deal = await Deal.findById(id);
        if (!deal) {
            return res.status(404).json({ msg: 'Deal not found' });
        }

        // Update deal fields if provided
        if (title) deal.title = title;
        if (store) deal.store = store;
        if (description) deal.description = description;
        if (startDate) deal.startDate = startDate;
        if (endDate) deal.endDate = endDate;
        if (brands) deal.brands = brands;
        if (category) deal.category = category;
        if (couponCode) deal.couponCode = couponCode;

        // If a new image file is provided, upload it to S3
        if (file) {
            deal.image = await uploadImageToS3(file);
        }

        await deal.save();
        res.status(200).json({ msg: 'Deal updated successfully', deal });
    } catch (error) {
        res.status(500).json({ msg: 'Error updating deal', error });
    }
};

// Delete a deal by ID
const deleteDeal = async (req, res) => {
    const { id } = req.params;

    try {
        const deal = await Deal.findByIdAndDelete(id);
        if (!deal) {
            return res.status(404).json({ msg: 'Deal not found' });
        }

        res.status(200).json({ msg: 'Deal deleted successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Error deleting deal', error });
    }
};


const getAllWishlistDealsForAdmin = async (req, res) => {
    try {
        // Find all deals that are in any user's wishlist (populate 'wishlist' to get deals)
        const users = await User.find().populate('wishlist');
        
        // Collect all deals from all users' wishlists
        const wishlistDeals = [];
        users.forEach(user => {
            user.wishlist.forEach(deal => {
                wishlistDeals.push(deal);
            });
        });

        if (wishlistDeals.length === 0) {
            return res.status(404).json({ msg: 'No deals found in any wishlist' });
        }

        res.status(200).json({ wishlistDeals });
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching wishlist deals for admin', error });
    }
};

module.exports = {
    addDeal,
    getAllDeals,
    getAllOwnDeals,
    getDealById,
    updateDeal,
    deleteDeal,
    getAllWishlistDealsForAdmin
};
