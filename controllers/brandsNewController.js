const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BrandsNew = require('../models/brandNew');
const Brands = require('../models/brandsModels');

const create = async (req,res)=>{
    const {name} = req.body;
    const file = req.file;
    if(!file ||!name){
        res.status(404).json({msg:'image and name is requierd'})
    }
    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `brandsNew/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        const brandsNew = new BrandsNew({
            name,
            image: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`,

        });

        await brandsNew.save();
        res.status(201).json({ msg: 'Brands New added successfully', brandsNew });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error adding Brands New', error });
    }

}

const getall = async (req, res) => {
    try {
        // Get pagination and search parameters from the query
        const { page = 1, limit = 10, search = "" } = req.query;

        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Build the search query
        const searchQuery = {
            name: { $regex: search, $options: "i" }, // 'i' makes the search case-insensitive
        };

        // Find brands with pagination and search applied
        const brandsNew = await BrandsNew.find(search ? searchQuery : {})
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count of matching documents for pagination
        const total = await BrandsNew.countDocuments(search ? searchQuery : {});

        // Send response with pagination details
        res.status(200).json({
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            data: brandsNew,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



const getbyid = async (req,res)=>{
    const {id} = req.params;
    try{
    const brandNew = await BrandsNew.findById(id);
    if(!brandNew){
        res.status(404).json({msg:"Brands New Not Found"});
    }
    res.status(200).json(brandNew);
    }
    catch(error)
    {
        res.status(500).json({error:error.message});
    }
}

const updatebyId = async (req,res)=>{
    const {id} = req.params;
    const {name}=req.body;
    const file = req.file;
    try{

        const brandNew = await BrandsNew.findById(id)
        
        if (!brandNew) {
            return res.status(404).json({ msg: 'Brand New not found' });
        }
        brandNew.name = name || brandNew.name;
        if(file){
            const uploadParams = {
                Bucket:process.env.AWS_S3_BUCKET,
                Key:`brandsNew/${Date.now()}_${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            const data = await s3Client.send(new PutObjectCommand(uploadParams));
            brandNew.image = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
     
        }
        await brandNew.save();
        res.status(200).json({ msg: 'Brand New updated successfully', brandNew });
    }
    catch(error)
    {
        res.status(500).json({error:error.message});
    }
}

const deletebyId = async (req, res) => {
    const { id } = req.params;

    try {
        const brandNew = await BrandsNew.findById(id);

        if (!brandNew) {
            return res.status(404).json({ msg: 'Brand New not found' });
        }

        // Delete image from S3
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: brandNew.image.split('.com/')[1], // Extract S3 key from the image URL
        };

        await s3Client.send(new DeleteObjectCommand(deleteParams));

        // Use findByIdAndDelete instead of remove
        await BrandsNew.findByIdAndDelete(id);

        res.status(200).json({ msg: 'Brands New deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error deleting BrandsNew', error });
    }
};

module.exports={
    create,
    getall,
    getbyid,
    updatebyId,
    deletebyId
}