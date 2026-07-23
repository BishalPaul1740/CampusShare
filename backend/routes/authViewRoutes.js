const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const { isLoggedIn } = require("../middleware/authMiddleware");

const {
    register,
    login,
    logout
} = require("../controllers/authController");

/* ===========================
   Register
=========================== */

router.post(
    "/register",
    upload.single("profileImage"),
    register
);

/* ===========================
   Login
=========================== */

router.post(
    "/login",
    login
);

/* ===========================
   Logout
=========================== */

router.post(
    "/logout",
    isLoggedIn,
    logout
);

module.exports = router;