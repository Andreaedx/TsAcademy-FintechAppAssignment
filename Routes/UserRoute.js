const userController = require('../Controllers/UserController');
const express = require('express');
const router = express.Router();


router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);


module.exports = router;