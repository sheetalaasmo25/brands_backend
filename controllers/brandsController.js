const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const moment = require('moment');
const Brands = require('../models/brandsModels');
const BrandsNew = require('../models/brandNew');
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
    const { email, password, brandNewData } = req.body; // Assuming brandNewData contains name and image for BrandsNew
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

        // Create the new BrandsNew document
        const newBrandNew = new BrandsNew({
            name: brandNewData?.name,
            image: brandNewData?.image, // You can upload this image to S3 too if necessary
        });
        await newBrandNew.save(); // Save the BrandsNew document

        // Determine the status based on the user's role
        const status = req.user && req.user.role === 'admin' ? 'approved' : 'pending';

        // Create a new brand with the determined status
        const brand = new Brands({
            name: req.body.name,
            images: imageUrls,
            area: req.body.area,
            description: req.body.description,
            city: req.body.city || null,
            email,
            password: hashedPassword,
            status,
            brandsNew: newBrandNew._id, // Save reference to BrandsNew
        });

        // Save the brand to the database
        await brand.save();
        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




exports.brandLogin = async (req, res) => {
    console.log("Working login...............")
    const { email, password } = req.body;
    const brand = await Brands.findOne({ email });
    if (!brand) {
        return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, brand.password);
    if (!match)
        return res.status(400).json({ msg: 'Invalid credentials' });

const token = jwt.sign({ id: brand._id, role: brand.role }, process.env.JWT_SECRET);
res.json({ token,msg:"Login Store Successfully." ,role:brand.role});
}

exports.getOwnProfileBrands = async (req,res)=>{
    console.log("Working ")
    try{
        console.log("Working try")
        const ownBrands = await Brands.findById(req.user.id).select('-password') .populate('selectedPackage');;
        res.json(ownBrands);
    }
    catch (error) {
    res.status(500).json({ msg: 'Error fetching Brands profile', error });
}
}

exports.updateOwnProfileBrands = async (req, res) => {
    try {
        const brand = await Brands.findById(req.user.id).populate('brandsNew'); // Populate the BrandsNew reference
        if (!brand) return res.status(404).json({ error: 'Brand not found' });

        // Handle file upload for the brand images
        if (req.files && req.files.length > 0) {
            brand.images = await uploadImagesToS3(req.files); // Ensure `uploadImagesToS3` handles array of files
        }

        // Update the main brand fields
        brand.name = req.body.name || brand.name;
        brand.area = req.body.area || brand.area;
        brand.description = req.body.description || brand.description;
        brand.city = req.body.city || brand.city;
        brand.email = req.body.email || brand.email;

        // Update the related BrandsNew document if necessary
        if (req.body.brandNewData) {
            // Assuming brandNewData contains fields like name and image
            const { name, image } = req.body.brandNewData;

            // If there's no BrandsNew document associated, create one
            if (!brand.brandsNew) {
                const newBrandNew = new BrandsNew({
                    name,
                    image, // You can upload this image to S3 if necessary
                });
                await newBrandNew.save();
                brand.brandsNew = newBrandNew._id; // Save the reference to the BrandsNew document
            } else {
                // Update the existing BrandsNew document
                brand.brandsNew.name = name || brand.brandsNew.name;
                brand.brandsNew.image = image || brand.brandsNew.image; // Upload image to S3 if needed
                await brand.brandsNew.save(); // Save the updated BrandsNew
            }
        }

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

        // Fetch brands with pagination, search, and populate brandsNew
        const brands = await Brands.find(searchQuery)
            .skip((page - 1) * limit)  // Skip based on current page and limit
            .limit(Number(limit))      // Limit the number of results per page
            .populate('brandsNew');     // Populate the 'brandsNew' reference

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
        const brand = await Brands.findById(req.params.id).populate('brandsNew');
        if (!brand) return res.status(404).json({ error: 'Brand not found' });
        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update brand by ID with multiple images
exports.updateBrandById = async (req, res) => {
    try {
        const brand = await Brands.findById(req.params.id).populate('brandsNew'); // Populate the BrandsNew reference
        if (!brand) return res.status(404).json({ error: 'Brand not found' });

        // Check if status is provided in the request body and update it
        if (req.body.status) {
            brand.status = req.body.status;
        }

        // If there are images, upload them to S3
        if (req.files) {
            brand.images = await uploadImagesToS3(req.files);
        }

        // Update the main brand fields
        brand.name = req.body.name || brand.name;
        brand.area = req.body.area || brand.area;
        brand.description = req.body.description || brand.description;
        brand.city = req.body.city || brand.city;
        brand.email = req.body.email || brand.email;

        // Update the related BrandsNew document if necessary
        if (req.body.brandNewData) {
            // Assuming brandNewData contains fields like name and image
            const { name, image } = req.body.brandNewData;

            // If there's no BrandsNew document associated, create one
            if (!brand.brandsNew) {
                const newBrandNew = new BrandsNew({
                    name,
                    image, // You can upload this image to S3 if necessary
                });
                await newBrandNew.save();
                brand.brandsNew = newBrandNew._id; // Save the reference to the BrandsNew document
            } else {
                // Update the existing BrandsNew document
                brand.brandsNew.name = name || brand.brandsNew.name;
                brand.brandsNew.image = image || brand.brandsNew.image; // Upload image to S3 if needed
                await brand.brandsNew.save(); // Save the updated BrandsNew
            }
        }

        await brand.save();
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


exports.incrementBrandCount = async (req, res) => {
    const { brandId, count, date } = req.body;
    const currentDate = moment(date).utc().startOf('day'); // Using UTC for consistency

    try {
        const brand = await Brands.findById(brandId);
        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        // Check if there's already a count entry for the current day
        const existingCount = brand.countHistory?.find(record =>
            moment(record.date).isSame(currentDate, 'day')
        );

        if (existingCount) {
            return res.status(400).json({ msg: 'Count already incremented for today' });
        }

        // Increment the count and update count history
        brand.count = (brand.count || 0) + 1;

        // Initialize countHistory if it's undefined and then push today's count
        brand.countHistory = brand.countHistory || [];
        brand.countHistory.push({
            date: currentDate.toDate(), // Convert to Date object before saving
            countIncremented: 1
        });

        await brand.save(); // Save the updated brand with incremented count

        res.status(200).json({ msg: 'Count incremented successfully', brand });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



