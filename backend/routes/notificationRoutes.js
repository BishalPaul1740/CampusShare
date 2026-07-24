const express = require("express");

const router = express.Router();

const {
    isLoggedIn
} = require("../middleware/authMiddleware");

const {
    getNotifications,
    markAsRead,
    markAllAsRead
} = require("../controllers/notificationController");


router.get(
    "/",
    isLoggedIn,
    getNotifications
);


router.put(
    "/read-all",
    isLoggedIn,
    markAllAsRead
);


router.put(
    "/:id/read",
    isLoggedIn,
    markAsRead
);


module.exports = router;