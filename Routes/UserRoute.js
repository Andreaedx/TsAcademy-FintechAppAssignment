const userController = require('../Controllers/UserController');
const express = require('express');
const router = express.Router();


router.post('/registeruser', userController.registerUser);


const { fintechLogin } = require('../services/nibssAdapter');

router.get('/test-nibss-login', async (req, res) => {
    try {
        const response = await fintechLogin();

        res.json({
            success: true,
            data: response
        });

    } catch (error) {

        console.error('NIBSS Login Error:', error);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
});

const nibssAdapter = require('../services/nibssAdapter');

console.log(nibssAdapter);

module.exports = router;