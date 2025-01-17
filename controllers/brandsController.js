const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const moment = require('moment');
const mongoose = require("mongoose");
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

// exports.addBrand = async (req, res) => {
//     const { email, password, brandNewData } = req.body; 
//     try {
//         // Check if the brand with the provided email already exists
//         const existingBrand = await Brands.findOne({ email });
//         if (existingBrand) {
//             return res.status(400).json({ msg: 'Brand already exists' });
//         }

//         // Hash the password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         // Upload images to S3
//         const imageUrls = await uploadImagesToS3(req.files);

//         // Create the new BrandsNew document
//         const newBrandNew = new BrandsNew({
//             name: brandNewData?.name,
//             image: brandNewData?.image, // You can upload this image to S3 too if necessary
//         });
//         await newBrandNew.save(); // Save the BrandsNew document

//         // Determine the status based on the user's role
//         const status = req.user && req.user.role === 'admin' ? 'approved' : 'pending';

//         // Create a new brand with the determined status
//         const brand = new Brands({
//             name: req.body.name,
//             images: imageUrls,
//             area: req.body.area,
//             description: req.body.description,
//             city: req.body.city || null,
//             email,
//             password: hashedPassword,
//             status,
//             brandsNew: newBrandNew._id, // Save reference to BrandsNew
//         });

//         // Save the brand to the database
//         await brand.save();
//         res.status(201).json(brand);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


exports.addBrand = async (req, res) => {
    try {
        const { email, password, brandNewData, package, pincode, packageAmount } = req.body;
        let { productCategory } = req.body;

        // Check if the brand already exists
        const existingBrand = await Brands.findOne({ email });
        if (existingBrand) {
            return res.status(400).json({ msg: "Brand already exists" });
        }

        // Ensure `productCategory` is properly formatted
        if (typeof productCategory === "string") {
            try {
                productCategory = JSON.parse(productCategory); // Convert from string if sent as JSON string
            } catch (error) {
                return res.status(400).json({ msg: "Invalid productCategory format" });
            }
        }
        if (!Array.isArray(productCategory)) {
            return res.status(400).json({ msg: "productCategory must be an array" });
        }

        // ✅ Correct way to convert category IDs to ObjectId
        productCategory = productCategory.map((id) => new mongoose.Types.ObjectId(id));

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upload images to S3
        const imageUrls = req.files ? await uploadImagesToS3(req.files) : [];

        // Create new BrandsNew document
        const newBrandNew = new BrandsNew({
            name: brandNewData?.name,
            image: brandNewData?.image,
        });
        await newBrandNew.save();

        // Set status based on user role
        const status = req.user && req.user.role === "admin" ? "approved" : "pending";

        // Create the brand
        const brand = new Brands({
            name: req.body.name,
            images: imageUrls,
            area: req.body.area,
            description: req.body.description,
            city: req.body.city || null,
            packageAmount,
            pincode,
            package,
            productCategory, // ✅ Now correctly formatted as an array of ObjectId
            email,
            password: hashedPassword,
            status,
            brandsNew: newBrandNew._id,
        });

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
    
    if (!match) {
        return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: brand._id, role: brand.role }, process.env.JWT_SECRET);

    // Include _id in the response along with the token and role
    res.json({
        token,
        msg: "Login Store Successfully.",
        role: brand.role,
        _id: brand._id  // Adding _id to the response
    });
}


exports.getOwnProfileBrands = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ msg: 'User ID is required' });

        const ownBrands = await Brands.findById(id)
            .select('-password')
            .populate('brandsNew productCategory');

        if (!ownBrands) return res.status(404).json({ msg: 'Brands not found for this user' });

        res.status(200).json(ownBrands);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOwnProfileBrands = async (req, res) => {
    try {
        const brand = await Brands.findById(req.user.id).populate('brandsNew');
        if (!brand) return res.status(404).json({ error: 'Brand not found' });

        if (req.files && req.files.length > 0) {
            brand.images = await uploadImagesToS3(req.files);
        }

        brand.name = req.body.name || brand.name;
        brand.area = req.body.area || brand.area;
        brand.description = req.body.description || brand.description;
        brand.city = req.body.city || brand.city;
        brand.email = req.body.email || brand.email;

        if (req.body.productCategory) {
            try {
                const parsedCategories = typeof req.body.productCategory === "string" ? JSON.parse(req.body.productCategory) : req.body.productCategory;
                if (!Array.isArray(parsedCategories)) throw new Error('productCategory must be an array');
                brand.productCategory = parsedCategories.map(id => new mongoose.Types.ObjectId(id));
            } catch (error) {
                return res.status(400).json({ msg: 'Invalid productCategory format' });
            }
        }

        if (req.body.brandNewData) {
            const { name, image } = req.body.brandNewData;
            if (!brand.brandsNew) {
                const newBrandNew = new BrandsNew({ name, image });
                await newBrandNew.save();
                brand.brandsNew = newBrandNew._id;
            } else {
                brand.brandsNew.name = name || brand.brandsNew.name;
                brand.brandsNew.image = image || brand.brandsNew.image;
                await brand.brandsNew.save();
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
        const { page = 1, limit = 10, search = "" } = req.query;
        const searchQuery = search ? { name: { $regex: search, $options: 'i' } } : {};

        const brands = await Brands.find(searchQuery)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('brandsNew productCategory');

        const totalBrands = await Brands.countDocuments(searchQuery);

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
        const brand = await Brands.findById(req.params.id).populate('brandsNew productCategory');
        if (!brand) return res.status(404).json({ error: 'Brand not found' });
        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateBrandById = async (req, res) => {
    try {
        const brand = await Brands.findById(req.params.id).populate('brandsNew');
        if (!brand) return res.status(404).json({ error: 'Brand not found' });

        if (req.body.status) brand.status = req.body.status;
        if (req.files) brand.images = await uploadImagesToS3(req.files);

        brand.name = req.body.name || brand.name;
        brand.area = req.body.area || brand.area;
        brand.description = req.body.description || brand.description;
        brand.city = req.body.city || brand.city;
        brand.email = req.body.email || brand.email;

        if (req.body.productCategory) {
            try {
                const parsedCategories = typeof req.body.productCategory === "string" ? JSON.parse(req.body.productCategory) : req.body.productCategory;
                if (!Array.isArray(parsedCategories)) throw new Error('productCategory must be an array');
                brand.productCategory = parsedCategories.map(id => new mongoose.Types.ObjectId(id));
            } catch (error) {
                return res.status(400).json({ msg: 'Invalid productCategory format' });
            }
        }

        if (req.body.brandNewData) {
            const { name, image } = req.body.brandNewData;
            if (!brand.brandsNew) {
                const newBrandNew = new BrandsNew({ name, image });
                await newBrandNew.save();
                brand.brandsNew = newBrandNew._id;
            } else {
                brand.brandsNew.name = name || brand.brandsNew.name;
                brand.brandsNew.image = image || brand.brandsNew.image;
                await brand.brandsNew.save();
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



