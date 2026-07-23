const User = require("../models/User");

const generateToken = require("../utils/generateToken");

const {
    registerSchema,
    loginSchema
} = require("../validators/authValidator");

const cloudinary = require("../config/cloudinary");

// if (error) {
//     return res.status(400).json({
//         success: false,
//         message: error.details[0].message
//     });
// }

const register = async (req, res) => {
    try {

        // Validate request body
        console.log("1. register() started");
        const { error } = registerSchema.validate(req.body);

        console.log("2. Joi validation completed");
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        console.log("3. Validation passed");
        const {
            name,
            email,
            password,
            rollNumber,
            department,
            year,
            phone,
            bio
        } = req.body;

        console.log("4. Request body extracted");

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        console.log("5. Email checked");
        
        if (existingEmail) {
            if (!req.originalUrl.startsWith("/api")) {
                req.flash("error", "Email already registered.");
                return res.redirect("/register");
            }
            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });
        }

        // Check if roll number already exists
        const existingRoll = await User.findOne({ rollNumber });

        if (existingRoll) {
            return res.status(409).json({
                success: false,
                message: "Roll number already registered."
            });
        }
        console.log("6. Roll checked");

        // Default profile image
        let profileImage = {
            url: "",
            public_id: ""
        };
        console.log("7. About to upload image");
        // Upload profile image if provided
        if (req.file) {
            console.log(req.file);
            const result = await cloudinary.uploader.upload(
                req.file.path,
                {
                    folder: "CampusShare/ProfileImages"
                }
            );

            profileImage = {
                url: result.secure_url,
                public_id: result.public_id
            };
        }
        

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            rollNumber,
            department,
            year,
            phone,
            bio,
            profileImage
        });
        console.log("8. user created");

        if (!req.originalUrl.startsWith("/api")) {
            return res.redirect("/login");
        }

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber,
                department: user.department,
                year: user.year,
                role: user.role,
                profileImage: user.profileImage
            }
        });

    } catch (error) {

        console.error("REGISTER ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const login = async (req, res) => {
    try {

        const { error } = loginSchema.validate(req.body);

        if (error) {

            if (!req.originalUrl.startsWith("/api")) {
                req.flash("error", error.details[0].message);
                return res.redirect("/login");
            }

            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });

        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");

        if (!user) {

            if (!req.originalUrl.startsWith("/api")) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/login");
            }

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });

        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {

            if (!req.originalUrl.startsWith("/api")) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/login");
            }

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });

        }

        const token = generateToken(user._id, user.role);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        if (!req.originalUrl.startsWith("/api")) {
            req.flash("success", `Welcome back, ${user.name}!`);
            return res.redirect("/profile");
        }

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber,
                department: user.department,
                year: user.year,
                role: user.role,
                profileImage: user.profileImage
            }
        });

    } catch (error) {

        if (!req.originalUrl.startsWith("/api")) {
            req.flash("error", "Something went wrong. Please try again.");
            return res.redirect("/login");
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const logout = async (req, res) => {
    try {

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        if (!req.originalUrl.startsWith("/api")) {

            req.flash(
                "success",
                "Logged out successfully."
            );

            return res.redirect("/");

        }

        return res.status(200).json({
            success: true,
            message: "Logout successful."
        });

    } catch (error) {

        console.error("LOGOUT ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getCurrentUser = async (req, res) => {
    try {

        return res.status(200).json({
            success: true,
            user: req.user
        });

    } catch (error) {

        console.error("GET CURRENT USER ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    register,
    login,
    logout,
    getCurrentUser
};