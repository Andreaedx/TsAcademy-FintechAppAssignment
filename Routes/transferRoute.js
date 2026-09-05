const transferController = require('../Controllers/transferController');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.post('/', protect, transferController.transfer);


module.exports = router;