const Brands = require('../models/brandsModels');
const Packages = require('../models/packagesModels')

const createPackages = async (req,res)=>{
    const {title,description,price,startDate,endDate}=req.body;
    try{
      const packages = new Packages({
        title,
        description,
        price,
        startDate,
        endDate
      });
      await packages.save();
      res.status(201).json({msg:'Package Created Successfully',packages})
    }
    catch(error){
        res.status(500).json({msg:'Error Adding Packages',error})
    }
}

const getallPackages = async (req,res)=>{
    try{
    const package =  await Packages.find();
    res.status(200).json(package)
    }
    catch(error){
        res.status(500).json({error:error.message});
    }
}

//getall packages for brands and user only active packages should show
const getallactivePackages = async (req,res)=>{
    try{

        const package = await Packages.find({status:'active'})
        res.json(package)

    }
    catch(error){
        res.status(500).json({error:error.message})
    }
}

const selectPackages = async (req, res) => {
    const { packageId } = req.params;
    const brandId = req.user.id;

    try {
        // Step 1: Confirm that the package exists
        const selectedPackage = await Packages.findById(packageId);
        if (!selectedPackage) {
            return res.status(404).json({ error: "Package Not Found" });
        }

        // Step 2: Update the brand's isActive status to true and set selectedPackage
        const updateResult = await Brands.updateOne(
            { _id: brandId },
            {
                $set: {
                    isActive: true,
                    selectedPackage: packageId, // Store the selected package ID
                },
            }
        );

        // Check if the update was successful
        if (updateResult.modifiedCount === 0) {
            return res.status(400).json({ error: "Failed to activate brand or update package" });
        }

        res.status(200).json({ message: "Package selected successfully, brand activated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




const getbyIdPackages = async (req,res)=>{
    const {id} = req.params;
    try{
      const package = await Packages.findById(id);
      if(!package){
        res.status(404).json({ msg: 'Packages not found'})
      }
      res.status(200).json(package);
    }
    catch(error){
        res.status(500).json({msg:"Error Feching Packages",error})
    }
}

const updatebyIdPackages = async (req,res)=>{
    const {id} = req.params;
    const {title,description,price,startDate,endDate,status}=req.body;
    try{
        const updatePackages = await Packages.findByIdAndUpdate(id,{
            title,
            description,
            price,
            startDate,
            endDate,
            status
        },{new:true});
        if(!updatePackages){
            return res.status(404).json({ msg: 'Packages not found' });
        }
    res.status(200).json({ msg: 'Packages updated successfully', updatePackages });
} catch (error) {
    res.status(500).json({ msg: 'Error updating updatePackages', error });
}
}

const deletebyIdPackages = async (req,res)=>{
const {id}= req.params;
try{
    const deletePackages = await Packages.findByIdAndDelete(id);
    if(!deletePackages){
        return res.status(404).json({ msg: 'Packages not found' });
    }

    res.status(200).json({ msg: 'Packages deleted successfully' });
} catch (error) {
    res.status(500).json({ msg: 'Error deleting Packages', error });
}
}
module.exports = {
    createPackages,
    getallPackages,
    getbyIdPackages,
    updatebyIdPackages,
    deletebyIdPackages,
    selectPackages,
    getallactivePackages
}