const express = require('express');
const  adminController  = require('../controllers/adminController');
const  categoryController  = require('../controllers/categoryController');
const  dealsController  = require('../controllers/dealsController');
const userController = require('../controllers/userController');
const BannerController = require('../controllers/bannerController');
const BannerCenterController = require('../controllers/centerBannerController');
const BannerBottomController = require('../controllers/bottomBannerController');
const brandsController = require('../controllers/brandsController');
const brandsNewController = require('../controllers/brandsNewController');
const packagesController = require('../controllers/packagesController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

const router = express.Router();
// Admin signup route
router.post('/signup', adminController.adminSignup);
// Admin login route
router.post('/login', adminController.adminLogin);
//Admin User Crud
router.post('/signup-user', authMiddleware, adminMiddleware,userController.signup);
router.get('/getall-users',authMiddleware, adminMiddleware, userController.getAllUsers);
router.get('/getbyid-user/:id',authMiddleware, adminMiddleware, userController.getUserById);
router.put('/update-user/:id', authMiddleware, adminMiddleware,userController.updateUserById);
router.delete('/delete-user/:id',authMiddleware, adminMiddleware, userController.deleteUserById);


// Add Brands route
router.post('/brands', upload.array('images', 10), authMiddleware, adminMiddleware, brandsController.addBrand); // Allow up to 10 images
router.get('/brands',authMiddleware, adminMiddleware, brandsController. getAllBrands);
router.get('/brands/:id', authMiddleware, adminMiddleware, brandsController.getBrandById);
router.put('/brands/:id', upload.array('images', 10), authMiddleware, adminMiddleware, brandsController.updateBrandById); // Allow up to 10 images
router.delete('/brands/:id', authMiddleware, adminMiddleware, brandsController.deleteBrandById);

// Add product category route
router.post('/add-category',upload.array('images', 10),authMiddleware, adminMiddleware, categoryController.addCategory);
router.get('/getall-category', authMiddleware, adminMiddleware,categoryController.getAllCategories);
router.get('/getbyid-category/:id',authMiddleware, adminMiddleware, categoryController.getCategoryById);
router.put('/update-category/:id',upload.array('images', 10),authMiddleware, adminMiddleware,categoryController.updateCategoryById);
router.delete('/delete-category/:id', authMiddleware, adminMiddleware,categoryController.deleteCategoryById);

// Routes for CRUD operations for Deals
router.post('/add-deals',authMiddleware, adminMiddleware,  upload.single('image'),dealsController.addDeal);           // Create deal
router.get('/getall-deals',authMiddleware, adminMiddleware, dealsController.getAllDeals);           // Read all deals
router.get('/getbyid-deals/:id',authMiddleware, adminMiddleware, dealsController.getDealById);        // Read deal by ID
router.put('/update-deals/:id',authMiddleware, adminMiddleware, upload.single('image'),dealsController.updateDeal);         // Update deal by ID
router.delete('/delete-deals/:id',authMiddleware, adminMiddleware, dealsController.deleteDeal);      // Delete deal by ID
// Add a new banner
router.post('/add-banner',authMiddleware, adminMiddleware,  upload.single('image'), BannerController.addBanner);

// Get all banners with pagination and search
router.get('/get-all-banners', authMiddleware, adminMiddleware, BannerController.getAllBanners);

// Get a banner by ID
router.get('/get-banner/:id', authMiddleware, adminMiddleware, BannerController.getBannerById);

// Update a banner
router.put('/update-banner/:id',authMiddleware, adminMiddleware,  upload.single('image'), BannerController.updateBanner);

// Delete a banner by ID
router.delete('/delete-banner/:id',authMiddleware, adminMiddleware,  BannerController.deleteBanner);


// Add Packages route
router.post('/package', authMiddleware, adminMiddleware, packagesController.createPackages); // Allow up to 10 images
router.get('/package',authMiddleware, adminMiddleware, packagesController.getallPackages);
router.get('/package/:id',authMiddleware, adminMiddleware, packagesController.getbyIdPackages);
router.put('/package/:id', authMiddleware, adminMiddleware, packagesController.updatebyIdPackages); // Allow up to 10 images
router.delete('/package/:id', authMiddleware, adminMiddleware, packagesController.deletebyIdPackages);

router.post('/brandsnew',authMiddleware, adminMiddleware,  upload.single('image'), brandsNewController.create);
router.get('/brandsnew',authMiddleware, adminMiddleware, brandsNewController.getall);
router.get('/brandsnew/:id',authMiddleware, adminMiddleware, brandsNewController.getbyid);
router.put('/brandsnew/:id', authMiddleware, adminMiddleware,upload.single('image'), brandsNewController.updatebyId); // Allow up to 10 images
router.delete('/brandsnew/:id', authMiddleware, adminMiddleware, brandsNewController.deletebyId);



// Add a new Centerbanner
router.post('/addcenter-banner',authMiddleware, adminMiddleware,  upload.single('image'), BannerCenterController.addBanner);

// Get all banners with pagination and search
router.get('/get-allcenter-banners', authMiddleware, adminMiddleware, BannerCenterController.getAllBanners);

// Get a banner by ID
router.get('/getcenter-banner/:id', authMiddleware, adminMiddleware, BannerCenterController.getBannerById);

// Update a banner
router.put('/updatecenter-banner/:id',authMiddleware, adminMiddleware,  upload.single('image'), BannerCenterController.updateBanner);

// Delete a banner by ID
router.delete('/deletecenter-banner/:id',authMiddleware, adminMiddleware,  BannerCenterController.deleteBanner);



// Add a new Bottombanner
router.post('/addbottom-banner',authMiddleware, adminMiddleware,  upload.single('image'), BannerBottomController.addBanner);

// Get all banners with pagination and search
router.get('/get-allbottom-banners', authMiddleware, adminMiddleware, BannerBottomController.getAllBanners);

// Get a banner by ID
router.get('/getbottom-banner/:id', authMiddleware, adminMiddleware, BannerBottomController.getBannerById);

// Update a banner
router.put('/updatebottom-banner/:id',authMiddleware, adminMiddleware,  upload.single('image'), BannerBottomController.updateBanner);

// Delete a banner by ID
router.delete('/deletebottom-banner/:id',authMiddleware, adminMiddleware,  BannerBottomController.deleteBanner);

module.exports = router;
