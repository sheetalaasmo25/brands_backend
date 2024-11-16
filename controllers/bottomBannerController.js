const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const Banner = require('../models/bottomBannerModels');

// Add a new banner
const addBanner = async (req, res) => {
    const { bannerName, url, pincode } = req.body;
    const file = req.file;

    if (!bannerName || !url || !pincode || !file) {
        return res.status(400).json({ msg: 'All fields are required: bannerName, url, pincode, and image.' });
    }

    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `banners/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        const banner = new Banner({
            bannerName,
            image: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`,
            url,
            pincode,
        });

        await banner.save();
        res.status(201).json({ msg: 'Banner added successfully', banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error adding banner', error });
    }
};

// Get all banners with pagination and search
const getAllBanners = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = search ? { bannerName: { $regex: search, $options: 'i' } } : {};

    try {
        const banners = await Banner.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Banner.countDocuments(query);

        res.status(200).json({
            banners,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error fetching banners', error });
    }
};

// Get banner by ID
const getBannerById = async (req, res) => {
    const { id } = req.params;

    try {
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ msg: 'Banner not found' });
        }

        res.status(200).json(banner);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error fetching banner', error });
    }
};

// Update banner
const updateBanner = async (req, res) => {
    const { id } = req.params;
    const { bannerName, url, pincode } = req.body;
    const file = req.file;

    try {
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ msg: 'Banner not found' });
        }

        banner.bannerName = bannerName || banner.bannerName;
        banner.url = url || banner.url;
        banner.pincode = pincode || banner.pincode;

        if (file) {
            const uploadParams = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: `banners/${Date.now()}_${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            const data = await s3Client.send(new PutObjectCommand(uploadParams));
            banner.image = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        }

        await banner.save();
        res.status(200).json({ msg: 'Banner updated successfully', banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error updating banner', error });
    }
};

// Delete banner
const deleteBanner = async (req, res) => {
    const { id } = req.params;

    try {
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ msg: 'Banner not found' });
        }

        // Delete image from S3
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: banner.image.split('.com/')[1], // Extract S3 key from the image URL
        };

        await s3Client.send(new DeleteObjectCommand(deleteParams));

        // Use findByIdAndDelete instead of remove
        await Banner.findByIdAndDelete(id);

        res.status(200).json({ msg: 'Banner deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error deleting banner', error });
    }
};


module.exports = {
    addBanner,
    getAllBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
};
