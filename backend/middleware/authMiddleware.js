const jwt = require("jsonwebtoken");
const User = require("../models/User");

const isLoggedIn = async (req, res, next) => {
    try {

        // Get token from cookies
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login."
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find user
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        // Attach user to request
        req.user = user;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });

    }
};

const isAdmin = (req, res, next) => {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin only."
        });
    }

    next();

};

const isOwner = (ownerField = "owner") => {

    return (req, res, next) => {

        if (!req.resource) {
            return res.status(500).json({
                success: false,
                message: "Resource not attached to request."
            });
        }

        if (
            req.resource[ownerField].toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Resource owner only."
            });
        }

        next();

    };

};

module.exports = {
    isLoggedIn,
    isAdmin,
    isOwner
};
