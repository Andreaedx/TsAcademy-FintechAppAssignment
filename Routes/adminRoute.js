const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const adminController = require('../Controllers/adminController');

router.use(protect);
router.use(admin);

router.get('/accounts', adminController.allAccounts);

module.exports = router;