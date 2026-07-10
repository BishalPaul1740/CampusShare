const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const { isLoggedIn } = require("../middleware/authMiddleware");

const {
    register,
    login,
    logout,
    getCurrentUser
} = require("../controllers/authController");

router.post(
    "/register",
    upload.single("profileImage"),
    (req, res, next) => {
        console.log("✅ Route reached");
        next();
    },
    register
);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", isLoggedIn, getCurrentUser);

module.exports = router;