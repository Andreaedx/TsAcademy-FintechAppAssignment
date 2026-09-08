const jwt = require('jsonwebtoken');
const User = require('../Models/User');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and has Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Not authorized, no token provided'
        });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //find the user by id 
        const user = await User.findById(decoded.id).select('-password');
        if(!user){
            return res.status(401).json({
                status: 'error',
                message: 'User no longer exist'
            });
        }
        req.user = user;

        // Continue to the controller
        return next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Not authorized, token failed'
        });
    }
};

module.exports = { protect };
