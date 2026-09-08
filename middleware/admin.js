const User = require('../Models/User');

const admin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Admin privileges required'
        });
    }

    next();
} 

module.exports = { admin };
