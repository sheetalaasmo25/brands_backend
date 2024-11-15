const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Category = require('../models/categoryModels');
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const addCategory = async (req, res) => {
    const { categoryName, description, brands } = req.body;
    const files = req.files; // Handle multiple files

    if (!categoryName || !description || !files || files.length === 0) {
        return res.status(400).json({ msg: 'categoryName, description, and images are required.' });
    }

    try {
        // Upload each file to S3 and store the URLs in an array
        const imageUrls = await Promise.all(
            files.map(async (file) => {
                const uploadParams = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: `${Date.now()}_${file.originalname}`,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                };
                await s3Client.send(new PutObjectCommand(uploadParams));
                return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
            })
        );

        const category = new Category({
            categoryName,
            images: imageUrls,
            description,
            brands,
        });

        await category.save();
        res.status(201).json({ msg: 'Category added successfully', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error adding category', error });
    }
};

const getAllCategories = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = search ? { categoryName: { $regex: search, $options: 'i' } } : {};

    try {
        const categories = await Category.find(query)
            .populate('brands') // Populates brand details if required
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await Category.countDocuments(query);
        res.status(200).json({
            categories,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error fetching categories', error });
    }
};

const getCategoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id).populate('brands');
        if (!category) {
            return res.status(404).json({ msg: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error fetching category', error });
    }
};

const updateCategoryById = async (req, res) => {
    const { id } = req.params;
    const { categoryName, description, brands } = req.body;
    const files = req.files;

    const updateData = { categoryName, description, brands };

    if (files && files.length > 0) {
        try {
            const imageUrls = await Promise.all(
                files.map(async (file) => {
                    const uploadParams = {
                        Bucket: process.env.AWS_S3_BUCKET,
                        Key: `${Date.now()}_${file.originalname}`,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    };
                    await s3Client.send(new PutObjectCommand(uploadParams));
                    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
                })
            );
            updateData.images = imageUrls;
        } catch (error) {
            console.error(error);
            return res.status(500).json({ msg: 'Error uploading images', error });
        }
    }

    try {
        const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
        if (!category) {
            return res.status(404).json({ msg: 'Category not found' });
        }
        res.status(200).json({ msg: 'Category updated successfully', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error updating category', error });
    }
};

const deleteCategoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ msg: 'Category not found' });
        }
        res.status(200).json({ msg: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error deleting category', error });
    }
};

module.exports = {
    addCategory,
    getAllCategories,
    getCategoryById,
    updateCategoryById,
    deleteCategoryById,
};
