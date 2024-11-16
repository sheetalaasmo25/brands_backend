// controllers/dealController.js
const Deal = require('../models/dealsModels');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: process.env.AWS_REGION });
// Add a new deal
// controllers/dealController.js

const addDeal = async (req, res) => {
    const { title, store,description, startDate, endDate, brands,category,couponCode } = req.body;
    const file = req.file;
    if (!title || !description || !startDate || !endDate || !brands ||!store ||!file) {
        return res.status(400).json({ msg: 'All fields are required: title, description, startDate, endDate, store,brands.' });
    }
    
    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `deals/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    try {
        const deal = new Deal({
            title,
            category,
            image: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`,
            description,
            couponCode,
            startDate,
            endDate,
            brands,
            store,
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
            .populate('brands')
            .populate('store')
            .populate('category'); 

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
//brand getall own deals
const getAllOwnDeals = async (req, res) => {
    const userId = req.user.id; // Assuming the store's ID is stored in req.user after JWT authentication
  

    try {
        let filter = { store: userId };
        
        // Fetch deals based on the filter
        const deals = await Deal.find(filter)
            .populate('brands')  // Populate brand details
            .populate('store')   // Populate store details
            .populate('category'); // Populate category details

        // If no deals found, return a message
        if (!deals.length) {
            return res.status(404).json({ msg: 'No deals found for this store' });
        }

        // If deals are found, return them
        res.status(200).json({ deals });
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching deals', error });
    }
};




// Get a deal by ID
const getDealById = async (req, res) => {
    const { id } = req.params;

    try {
        const deal = await Deal.findById(id).populate('brands')
        .populate('store')
        .populate('category');  // Populates brand details
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
    const { title, store, description, startDate, endDate, brands, category, couponCode, isShow, status } = req.body;
    const file = req.file;
  
    if (!id) {
      return res.status(400).json({ msg: 'Deal ID is required' });
    }
  
    try {
      // Find the existing deal by ID
      const deal = await Deal.findById(id);
      if (!deal) {
        return res.status(404).json({ msg: 'Deal not found' });
      }
  
      // Update the deal fields if they are provided
      if (title) deal.title = title;
      if (category) deal.category = category;
      if (description) deal.description = description;
      if (couponCode) deal.couponCode = couponCode;
      if (startDate) deal.startDate = startDate;
      if (endDate) deal.endDate = endDate;
      if (brands) deal.brands = brands;
      if (store) deal.store = store;
      if (status) deal.status = status;
      if (isShow !== undefined) deal.isShow = isShow; // Update isShow as a boolean
      
      if (file) {
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `deal/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        deal.image = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
      }
  
      await deal.save();
      res.status(200).json({ msg: 'Deal updated successfully', deal });
    } catch (error) {
      console.error('Error updating deal:', error.message);
      res.status(500).json({
        msg: 'Error updating deal',
        error: error.message || 'Unknown error',
      });
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
    getAllOwnDeals
};
