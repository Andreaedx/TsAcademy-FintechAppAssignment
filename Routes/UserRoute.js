const userController = require('../Controllers/UserController');
const express = require('express');
const router = express.Router();


router.post('/registeruser', userController.registerUser);


module.exports = router;