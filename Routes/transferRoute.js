const transferController = require('../Controllers/transferController');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.post('/', protect, transferController.transfer);
router.get('/transactions/:reference', protect, transferController.getTransactionByReference);
router.get('/balance/:accountNumber', protect, transferController.getBalancebyAccountNumber);


module.exports = router;