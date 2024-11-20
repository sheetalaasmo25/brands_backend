const express = require('express');
const userController = require('../controllers/userController');
const  categoryController  = require('../controllers/categoryController');
const  dealsController  = require('../controllers/dealsController');
const  brandsController  = require('../controllers/brandsController');
const  bannerController  = require('../controllers/bannerController');
const BannerCenterController = require('../controllers/centerBannerController');
const BannerBottomController = require('../controllers/bottomBannerController');
const packagesController = require('../controllers/packagesController');
const brandsNewController = require('../controllers/brandsNewController');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Signup route
router.post('/signup', userController.signup);

// Login route
router.post('/login', userController.login);

// Get user profile route
router.get('/profile', authMiddleware, userController.getProfile);
// update user profile route
router.get('/update-profile', authMiddleware, userController.updateProfile);
router.get('/brands',authMiddleware, brandsController.getAllBrands);
router.get('/getall-category', authMiddleware,categoryController.getAllCategories);
router.get('/getall-deals',authMiddleware, dealsController.getAllDeals); 
router.get('/package',authMiddleware, packagesController.getallactivePackages);    
// Get all banners with pagination and search
router.get('/get-all-banners', authMiddleware, bannerController.getAllBanners);
// Get all banners with pagination and search
router.get('/get-allcenter-banners', authMiddleware, BannerCenterController.getAllBanners);
// Get all banners with pagination and search
router.get('/get-allbottom-banners', authMiddleware, BannerBottomController.getAllBanners);
//brands
router.get('/brandsnew',authMiddleware, brandsNewController.getall);
module.exports = router;
