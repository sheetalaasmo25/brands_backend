const express = require('express');
const brandsController = require('../controllers/brandsController');
const {authMiddleware,storeMiddleware} = require('../middleware/auth')
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });


router.post('/brands', upload.array('images', 10),brandsController.addBrand);
router.post('/login', brandsController.brandLogin);


router.get('/getown-profile', authMiddleware,storeMiddleware,brandsController.getOwnProfileBrands);
router.put('/updateown-profile', upload.array('images', 10),authMiddleware,storeMiddleware,brandsController.updateOwnProfileBrands);
router.get('/brands',authMiddleware,storeMiddleware, brandsController.getAllBrands);
module.exports = router;
