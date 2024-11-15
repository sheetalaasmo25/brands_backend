const express = require('express');
const brandsController = require('../controllers/brandsController');
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
module.exports = router;
