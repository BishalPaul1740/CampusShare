const express = require("express");

const router = express.Router();

/* ===========================
   Home
=========================== */

router.get("/", (req, res) => {

    res.render("pages/home", {
        title: "CampusShare",
        currentPage: "/"
    });

});

/* ===========================
   Login
=========================== */

router.get("/login", (req, res) => {

    res.render("auth/login", {
        title: "Login",
        currentPage: "/login"
    });

});

/* ===========================
   Register
=========================== */

router.get("/register", (req, res) => {

    res.render("auth/register", {
        title: "Register",
        currentPage: "/register"
    });

});

/* ===========================
   Profile
=========================== */

router.get("/profile", (req, res) => {

    res.render("auth/profile", {
        title: "My Profile",
        currentPage: "/profile"
    });

});

module.exports = router;