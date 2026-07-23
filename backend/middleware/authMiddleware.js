const jwt = require("jsonwebtoken");
const User = require("../models/User");

const isLoggedIn = async (req, res, next) => {
    try {
        console.log("----------------");
        console.log("Cookies:", req.cookies);
        console.log("Token:", req.cookies.token);

        // Get token from cookies
        const token = req.cookies.token;

        if (!token) {
            if (!req.originalUrl.startsWith("/api")) {
                return res.redirect("/login");
            }
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
        console.log("Decoded:", decoded);

        // Find user
        // Find user
        const user = await User.findById(decoded.id);

        console.log("User:", user);

        if (!user) {

            if (!req.originalUrl.startsWith("/api")) {
                return res.redirect("/login");
            }

            return res.status(401).json({
                success: false,
                message: "User not found."
            });

        }

        // Attach user to request
        req.user = user;

        console.log("Reached next()");
        next();

    } catch (error) {
        if (!req.originalUrl.startsWith("/api")) {
            return res.redirect("/login");
        }

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

const optionalAuth = async (req, res, next) => {

    try {

        const token = req.cookies.token;

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        req.user = user || null;

        next();

    } catch (error) {

        req.user = null;
        next();

    }

};

module.exports = {
    isLoggedIn,
    optionalAuth,
    isAdmin,
    isOwner
};
