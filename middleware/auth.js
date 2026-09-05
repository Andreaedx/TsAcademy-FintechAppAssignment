const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    // 1. Check if the Authorization header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        try {
            // 2. Extract the token string (splits "Bearer <token>" by space)
            token = authHeader.split(' ')[1];

            // 3. Verify the token with your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Attach the decoded payload to req.user 🎯
            req.user = decoded; 

            // 5. Move to the next middleware/controller
            return next();
        } catch (error) {
            return res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
        }
    }

    // If no token is provided at all
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };
