const express = require("express");

const router = express.Router();

const {
    isLoggedIn,
    isAdmin
} = require("../middleware/authMiddleware");

const {
    createReservation,
    approveReservation,
    rejectReservation,
    cancelReservation,
    getReservation,
    getReservations,
    getMyReservations,
    getOwnerReservations
} = require("../controllers/reservationController");

router.post(
    "/:resourceId",
    isLoggedIn,
    createReservation
);

router.put(
    "/:id/approve",
    isLoggedIn,
    approveReservation
);

router.put(
    "/:id/reject",
    isLoggedIn,
    rejectReservation
);

router.put(
    "/:id/cancel",
    isLoggedIn,
    cancelReservation
);

router.get(
    "/my",
    isLoggedIn,
    getMyReservations
);

router.get(
    "/owner",
    isLoggedIn,
    getOwnerReservations
);

router.get(
    "/admin",
    isLoggedIn,
    isAdmin,
    getReservations
);

router.get(
    "/:id",
    isLoggedIn,
    getReservation
);

module.exports = router;