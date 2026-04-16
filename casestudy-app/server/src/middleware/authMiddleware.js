const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_dev_secret');
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const requireRole = (allowedRoles) => (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

authMiddleware.requireRole = requireRole;

module.exports = authMiddleware;
