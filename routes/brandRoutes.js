const express = require('express');
const brandsController = require('../controllers/brandsController');
const  categoryController  = require('../controllers/categoryController');
const brandsNewController = require('../controllers/brandsNewController');
const  dealsController  = require('../controllers/dealsController');
const {authMiddleware,storeMiddleware} = require('../middleware/auth')
const router = express.Router();
const multer = require('multer');

const packagesController = require('../controllers/packagesController');
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });


router.post('/brands', upload.array('images', 10),brandsController.addBrand);
router.post('/login', brandsController.brandLogin);


router.get('/getown-profile', authMiddleware,storeMiddleware,brandsController.getOwnProfileBrands);
router.put('/updateown-profile', upload.array('images', 10),authMiddleware,storeMiddleware,brandsController.updateOwnProfileBrands);
router.get('/package',authMiddleware,storeMiddleware, packagesController.getallactivePackages);  
router.post('/select-package/:packageId',authMiddleware,storeMiddleware, packagesController.selectPackages);
router.get('/getall-category', authMiddleware,storeMiddleware,categoryController.getAllCategories);
router.get('/brandsnew',authMiddleware,storeMiddleware, brandsNewController.getall);
//add deals store
router.post('/add-deals',authMiddleware, storeMiddleware,  upload.single('image'),dealsController.addDeal);
router.get('/getown-deals', authMiddleware,storeMiddleware,dealsController.getAllOwnDeals);
router.get('/getbyid-deals/:id',authMiddleware,storeMiddleware, dealsController.getDealById);
router.put('/update-deals/:id',authMiddleware,storeMiddleware, upload.single('image'),dealsController.updateDeal);         // Update deal by ID
router.delete('/delete-deals/:id',authMiddleware,storeMiddleware, dealsController.deleteDeal); 
module.exports = router;
