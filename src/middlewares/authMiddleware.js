import TokenBlacklist from "../models/BlacklistMode.js";
import User from "../models/UserModel.js";
import jwt from 'jsonwebtoken';


export const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]; // Get token from cookies or Authorization header
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const isBlacklisted = await TokenBlacklist.findOne({ token });

    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized: Token is blacklisted' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);

        req.user = user; // Attach the user object to the request for use in subsequent handlers
        return next();

    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
}

export const authSystemUserMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]; // Get token from cookies or Authorization header
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const isBlacklisted = await TokenBlacklist.findOne({ token });

    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized: Token is blacklisted' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("+systemUser"); // Include the systemUser field for checking

        if (!user.systemUser) {
            return res.status(403).json({ message: 'Forbidden: Access is denied' });
        }

        req.user = user; // Attach the user object to the request for use in subsequent handlers

        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
}