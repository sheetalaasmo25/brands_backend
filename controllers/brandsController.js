const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Brands = require('../models/brandsModels');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configure S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Helper function to upload multiple images to S3
async function uploadImagesToS3(files) {
    const imageUrls = await Promise.all(files.map(async (file) => {
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `${Date.now()}_${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        };
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
    }));
    return imageUrls;
}

exports.addBrand = async (req, res) => {
   
    const { email, password } = req.body;
    try {
        // Check if the brand with the provided email already exists
        const existingBrand = await Brands.findOne({ email });
        if (existingBrand) {
            return res.status(400).json({ msg: 'Brand already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upload images to S3
        const imageUrls = await uploadImagesToS3(req.files);

        // Determine the status based on the user's role
        const status = req.user && req.user.role === 'admin' ? 'approved' : 'pending';

        // Create a new brand with the determined status
        const brand = new Brands({
            name: req.body.name,
            images: imageUrls,
            location: req.body.location,
            description: req.body.description,
            landmark: req.body.landmark || null,
            email,
            password: hashedPassword,
            status // Set status based on the user's role
        });

        // Save the brand to the database
        await brand.save();
        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.brandLogin = async (req, res) => {
    const { email, password } = req.body;
    const brand = await Brands.findOne({ email });
    if (!brand) {
        return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, brand.password);
    if (!match)
        return res.status(400).json({ msg: 'Invalid credentials' });

const token = jwt.sign({ id: brand._id, role: brand.role }, process.env.JWT_SECRET);
res.json({ token });
}

exports.getOwnProfileBrands = async (req,res)=>{
    try{
        const ownBrands = await Brands.findById(req.user.id).select('-password');
        res.json(ownBrands);
    }
    catch (error) {
    res.status(500).json({ msg: 'Error fetching Brands profile', error });
}
}



exports.updateOwnProfileBrands = async (req, res) => {
    try {
        const brand = await Brands.findById(req.user.id);
        if (!brand) return res.status(404).json({ error: 'Brand not found' });

        // Handle file upload if req.files exists
        if (req.files && req.files.length > 0) {
            brand.images = await uploadImagesToS3(req.files); // Ensure `uploadImagesToS3` handles array of files
        }

        // Update brand fields based on form data
        brand.name = req.body.name || brand.name;
        brand.location = req.body.location || brand.location;
        brand.description = req.body.description || brand.description;
        brand.landmark = req.body.landmark || brand.landmark;
        brand.email = req.body.email || brand.email;

        await brand.save();
        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.getAllBrands = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query; // Default to page 1, limit 10, and no search

        // Build the search query
        const searchQuery = search ? {
            name: { $regex: search, $options: 'i' } // case-insensitive search for name
        } : {};

        // Fetch brands with pagination and search
        const brands = await Brands.find(searchQuery)
            .skip((page - 1) * limit)  // Skip based on current page and limit
            .limit(Number(limit))      // Limit the number of results per page
            

        const totalBrands = await Brands.countDocuments(searchQuery); // Get total count of brands for pagination info

        // Return the paginated brands along with total count for pagination
        res.status(200).json({
            brands,
            totalBrands,
            totalPages: Math.ceil(totalBrands / limit),
            currentPage: Number(page)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBrandById = async (req, res) => {
    try {
        const brand = await Brands.findById(req.params.id);
        if (!brand) return res.status(404).json({ error: 'Brand not found' });
        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update brand by ID with multiple images
exports.updateBrandById = async (req, res) => {
    try {
        const brand = await Brands.findById(req.params.id);
        if (!brand) return res.status(404).json({ error: 'Brand not found' });

        // Check if status is provided in the request body and update it
        if (req.body.status) {
            brand.status = req.body.status;
        }

        // If there are images, upload them to S3
        if (req.files) {
            brand.images = await uploadImagesToS3(req.files);
        }

        // Update other fields if provided
        brand.name = req.body.name || brand.name;
        brand.location = req.body.location || brand.location;
        brand.description = req.body.description || brand.description;
        brand.landmark = req.body.landmark || brand.landmark;
        brand.email = req.body.email || brand.email;

        // Save the updated brand
        await brand.save();

        // Send back the updated brand
        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBrandById = async (req, res) => {
    try {
        const brand = await Brands.findByIdAndDelete(req.params.id);
        if (!brand) return res.status(404).json({ error: 'Brand not found' });
        res.status(200).json({ message: 'Brand deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
