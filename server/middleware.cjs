const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'your-default-secret';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.error('[Auth Middleware] Invalid token:', err.message);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };
