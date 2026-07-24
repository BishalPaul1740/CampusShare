const Notification = require("../models/Notification");

/* =====================================
   Get My Notifications
===================================== */

const getNotifications = async (req, res) => {

    try {

        const notifications = await Notification.find({
            receiver: req.user._id
        })
            .populate("sender", "name")
            .populate("resource", "title")
            .populate("reservation")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


/* =====================================
   Mark Notification as Read
===================================== */

const markAsRead = async (req, res) => {

    try {

        const notification = await Notification.findOne({
            _id: req.params.id,
            receiver: req.user._id
        });

        if (!notification) {

            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });

        }

        notification.isRead = true;

        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification marked as read."
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


/* =====================================
   Mark All Notifications as Read
===================================== */

const markAllAsRead = async (req, res) => {

    try {

        await Notification.updateMany(
            {
                receiver: req.user._id,
                isRead: false
            },
            {
                isRead: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read."
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
/* =====================================
   Render Notifications Page
===================================== */

const renderNotificationsPage = async (req, res) => {

    try {

        const notifications = await Notification.find({
            receiver: req.user._id
        })
            .populate("sender", "name")
            .populate("resource", "title")
            .sort({ createdAt: -1 });

        const unreadCount = notifications.filter(
            notification => !notification.isRead
        ).length;

        res.render("notifications/index", {
            title: "Notifications",
            currentPage: "/notifications",
            notifications,
            unreadCount,
            unreadNotificationCount: unreadCount,
            user: req.user
        });

    } catch (error) {

        return res.status(500).send(error.message);

    }

};
/* =====================================
   Mark All Notifications Read (View)
===================================== */

const markAllNotificationsReadView = async (req, res) => {

    try {

        await Notification.updateMany(
            {
                receiver: req.user._id,
                isRead: false
            },
            {
                isRead: true
            }
        );

        return res.redirect("/notifications");

    } catch (error) {

        return res.status(500).send(error.message);

    }

};
const markNotificationReadView = async (req, res) => {

    try {

        await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                receiver: req.user._id
            },
            {
                isRead: true
            }
        );

        return res.redirect("/notifications");

    } catch (error) {

        return res.status(500).send(error.message);

    }

};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    renderNotificationsPage,
    markAllNotificationsReadView,
    markNotificationReadView
};