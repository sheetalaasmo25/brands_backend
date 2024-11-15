// controllers/dealController.js
const Deal = require('../models/dealsModels');

// Add a new deal
// controllers/dealController.js

const addDeal = async (req, res) => {
    const { title, discountAmount, description, dealPrice, originalPrice, startDate, endDate, status, brands } = req.body;

    try {
        const deal = new Deal({
            title,
            discountAmount,
            description,
            dealPrice,
            originalPrice,
            startDate,
            endDate,
            status,
            brands,
        });

        await deal.save();
        res.status(201).json({ msg: 'Deal added successfully', deal });
    } catch (error) {
        res.status(500).json({ msg: 'Error adding deal', error });
    }
};


// Get all deals
// Get all deals
const getAllDeals = async (req, res) => {
    const { page = 1, limit = 10, searchTerm = "" } = req.query;

    try {
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        const filter = searchTerm ? {
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }
            ]
        } : {};

        const totalDeals = await Deal.countDocuments(filter);
        const deals = await Deal.find(filter)
            .skip(skip)
            .limit(limitNumber)
            .populate('brands'); // Populates brand details

        res.status(200).json({
            totalDeals,
            totalPages: Math.ceil(totalDeals / limitNumber),
            currentPage: pageNumber,
            deals,
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching deals', error });
    }
};

// Get a deal by ID
const getDealById = async (req, res) => {
    const { id } = req.params;

    try {
        const deal = await Deal.findById(id).populate('brands'); // Populates brand details
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
    const { title, discountAmount, description, dealPrice, originalPrice, startDate, endDate, status, brands } = req.body;

    try {
        const updatedDeal = await Deal.findByIdAndUpdate(id, {
            title,
            discountAmount,
            description,
            dealPrice,
            originalPrice,
            startDate,
            endDate,
            status,
            brands,
        }, { new: true }).populate('brands'); // Populates brand details

        if (!updatedDeal) {
            return res.status(404).json({ msg: 'Deal not found' });
        }

        res.status(200).json({ msg: 'Deal updated successfully', updatedDeal });
    } catch (error) {
        res.status(500).json({ msg: 'Error updating deal', error });
    }
};


// Delete a deal by ID
const deleteDeal = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedDeal = await Deal.findByIdAndDelete(id);

        if (!deletedDeal) {
            return res.status(404).json({ msg: 'Deal not found' });
        }

        res.status(200).json({ msg: 'Deal deleted successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Error deleting deal', error });
    }
};

module.exports = {
    addDeal,
    getAllDeals,
    getDealById,
    updateDeal,
    deleteDeal,
};
