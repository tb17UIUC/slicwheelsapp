const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.json());

const {
    createLogo,
    deleteById,
    getSingleLogo,
    getAllLogos,
} = require('../controllers/post');
const multer = require('../middlewares/multer');

router.post('/api/logo/create', createLogo);
router.delete('/api/logo/delete/:imageId', deleteById);
router.get('/api/logo/get-logo/:imageId', getSingleLogo);
router.get('/api/logo/get-all-logos', getAllLogos);

module.exports = router;
