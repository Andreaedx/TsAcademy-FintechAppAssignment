const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.use(protect);
router.use(admin);

router.get('/accounts', )