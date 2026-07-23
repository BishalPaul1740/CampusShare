const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const { isLoggedIn, optionalAuth } = require("../middleware/authMiddleware");

const {
    renderResourcesPage,
    renderResourceDetailsPage,
    renderCreateResourcePage,
    createResourceView,
    renderEditResourcePage,
    updateResourceView
} = require("../controllers/resourceController");

const {
    renderReservationForm,
    createReservationView,
    renderMyReservationsPage,
    renderOwnerReservationsPage,
    renderReservationDetailsPage,
    approveReservation,
    rejectReservation
} = require("../controllers/reservationController");

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
   Resources
=========================== */

router.get("/resources", renderResourcesPage);

/* ===========================
   Create Resource
=========================== */

router.get("/resources/new", isLoggedIn, renderCreateResourcePage);

router.post(
    "/resources/new",
    isLoggedIn,
    upload.array("images", 5),
    createResourceView
);

router.get(
    "/resources/:id/reserve",
    isLoggedIn,
    renderReservationForm
);

router.post(
    "/resources/:id/reserve",
    isLoggedIn,
    createReservationView
);

router.get(
    "/resources/:id/edit",
    isLoggedIn,
    renderEditResourcePage
);

router.post(
    "/resources/:id/edit",
    isLoggedIn,
    upload.array("images", 5),
    updateResourceView
);

router.get(
    "/reservations",
    isLoggedIn,
    renderMyReservationsPage
);

router.get(
    "/owner/reservations",
    isLoggedIn,
    renderOwnerReservationsPage
);
router.get(
    "/reservations/:id",
    isLoggedIn,
    renderReservationDetailsPage
);
router.post(
    "/reservations/:id/approve",
    isLoggedIn,
    approveReservation
);
router.post(
    "/reservations/:id/reject",
    isLoggedIn,
    rejectReservation
);

/* ===========================
   Resource Details
=========================== */

router.get("/resources/:id", optionalAuth, renderResourceDetailsPage);

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

router.get("/profile", isLoggedIn, (req, res) => {
    res.render("auth/profile", {
        title: "My Profile",
        currentPage: "/profile",
        user: req.user
    });
});

module.exports = router;