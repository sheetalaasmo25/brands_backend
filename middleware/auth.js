const jwt = require('jsonwebtoken');
const User = require('../models/userModles');

// Middleware to verify token and set user in request
// const authMiddleware = (req, res, next) => {
//     const token = req.header('Authorization')?.split(' ')[1];
//     if (!token) {
//         return res.status(401).json({ msg: 'No token, authorization denied' });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (error) {
//         res.status(401).json({ msg: 'Token is not valid' });
//     }
// };
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Extract token after 'Bearer ' if present, otherwise use the entire header
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied, admin only' });
    }
    next();
};

// Middleware to check if user is admin
const storeMiddleware = (req, res, next) => {
    console.log("store Middleware")
    if (req.user.role !== 'store') {
        return res.status(403).json({ msg: 'Access denied, store only' });
    }
    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    storeMiddleware
};
