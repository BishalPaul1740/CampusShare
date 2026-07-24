const Reservation = require("../models/Reservation");
const Resource = require("../models/Resource");
const User = require("../models/User");
const Notification = require("../models/Notification");

const {
    createReservationSchema,
    approveReservationSchema,
    rejectReservationSchema,
    cancelReservationSchema
} = require("../validators/reservationValidator");

/* ===================================
   Create Reservation
=================================== */

const createReservation = async (req, res) => {

    try {

        const { error } = createReservationSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { startDate, endDate, remarks } = req.body;
        const resourceId = req.params.resourceId;

        const resource = await Resource.findById(resourceId);

        if (!resource || resource.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        if (resource.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot reserve your own resource."
            });
        }

        if (resource.availabilityStatus !== "Available") {
            return res.status(400).json({
                success: false,
                message: "Resource is not available."
            });
        }

        if (
            resource.availableQuantity <= 0 ||
            resource.availabilityStatus !== "Available"
        ) {
            return res.status(400).json({
                success: false,
                message: "Resource is currently unavailable."
            });
        }

        const overlappingReservations = await Reservation.countDocuments({
            resource: resourceId,
            status: "Approved",
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        });

        if (overlappingReservations >= resource.availableQuantity) {
            return res.status(409).json({
                success: false,
                message: "No units available for the selected dates."
            });
        }

        const reservation = await Reservation.create({
            resource: resource._id,
            borrower: req.user._id,
            owner: resource.owner,
            startDate,
            endDate,
            remarks
        });
        await Notification.create({
            receiver: resource.owner,
            sender: req.user._id,
            type: "reservation_request",
            message: `${req.user.name} requested your resource "${resource.title}".`,
            resource: resource._id,
            reservation: reservation._id
        });

        return res.status(201).json({
            success: true,
            message: "Reservation request submitted.",
            reservation
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const approveReservation = async (req, res) => {

    try {

        const { error } = approveReservationSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const reservation = await Reservation.findById(req.params.id)
            .populate("resource");

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found."
            });
        }
        
        const overlappingReservations = await Reservation.countDocuments({
            _id: { $ne: reservation._id },
            resource: reservation.resource._id,
            status: "Approved",
            startDate: { $lte: reservation.endDate },
            endDate: { $gte: reservation.startDate }
        });

        if (overlappingReservations >= reservation.resource.availableQuantity) {
            return res.status(409).json({
                success: false,
                message: "No units available for the selected dates."
            });
        }

        

        if (reservation.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only owner can approve."
            });
        }

        if (reservation.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Reservation already processed."
            });
        }

        if (reservation.resource.availableQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Resource unavailable."
            });
        }

        reservation.status = "Approved";
        reservation.remarks = req.body.remarks || reservation.remarks;
        reservation.approvedAt = new Date();

        reservation.resource.availableQuantity--;
        if (reservation.resource.availableQuantity === 0) {
            reservation.resource.availabilityStatus = "Unavailable";
        }

        await reservation.resource.save();
        await reservation.save();

        await Notification.create({
            receiver: reservation.borrower,
            sender: req.user._id,
            type: "reservation_approved",
            message: `Your reservation for "${reservation.resource.title}" has been approved.`,
            resource: reservation.resource._id,
            reservation: reservation._id
        });

        if (req.originalUrl.startsWith("/api/")) {

            return res.status(200).json({
                success: true,
                message: "Reservation approved successfully.",
                reservation
            });

        }

        return res.redirect("/owner/reservations");

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const rejectReservation = async (req, res) => {

    try {

        const { error } = rejectReservationSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found."
            });
        }

        if (reservation.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only owner can reject."
            });
        }

        if (reservation.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Reservation already processed."
            });
        }

        reservation.status = "Rejected";
        reservation.remarks = req.body.remarks;

        await reservation.save();
        const resource = await Resource.findById(reservation.resource);

        await Notification.create({
            receiver: reservation.borrower,
            sender: req.user._id,
            type: "reservation_rejected",
            message: `Your reservation for "${resource.title}" has been rejected.`,
            resource: resource._id,
            reservation: reservation._id
        });

        if (req.originalUrl.startsWith("/api/")) {

            return res.status(200).json({
                success: true,
                message: "Reservation rejected successfully.",
                reservation
            });

        }

        return res.redirect("/owner/reservations");

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const cancelReservation = async (req, res) => {

    try {

        const { error } = cancelReservationSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const reservation = await Reservation.findById(req.params.id)
            .populate("resource");

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found."
            });
        }

        if (reservation.borrower.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only borrower can cancel."
            });
        }

        if (["Cancelled", "Rejected", "Completed"].includes(reservation.status)) {
            return res.status(400).json({
                success: false,
                message: "Reservation cannot be cancelled."
            });
        }

        if (reservation.status === "Approved") {
            reservation.resource.availableQuantity++;
            if (
                reservation.resource.availableQuantity > 0 &&
                reservation.resource.availabilityStatus === "Unavailable"
            ) {
                reservation.resource.availabilityStatus = "Available";
}
            await reservation.resource.save();
        }

        reservation.status = "Cancelled";
        reservation.cancelledAt = new Date();
        reservation.remarks = req.body.remarks || reservation.remarks;

        await reservation.save();
        const resource = await Resource.findById(reservation.resource);

        await Notification.create({
            receiver: reservation.owner,
            sender: req.user._id,
            type: "reservation_rejected",
            message: `${req.user.name} cancelled the reservation for "${resource.title}".`,
            resource: resource._id,
            reservation: reservation._id
        });

        return res.status(200).json({
            success: true,
            message: "Reservation cancelled.",
            reservation
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getReservation = async (req, res) => {

    try {

        const reservation = await Reservation.findById(req.params.id)
            .populate("resource")
            .populate("borrower", "name email profileImage")
            .populate("owner", "name email profileImage");

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found."
            });
        }

        const userId = req.user._id.toString();

        if (
            reservation.borrower._id.toString() !== userId &&
            reservation.owner._id.toString() !== userId &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        return res.status(200).json({
            success: true,
            reservation
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getReservations = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.status)
            filter.status = req.query.status;

        const reservations = await Reservation.find(filter)
            .populate("resource", "title")
            .populate("borrower", "name email")
            .populate("owner", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Reservation.countDocuments(filter);

        return res.status(200).json({
            success: true,
            count: reservations.length,
            totalReservations: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            reservations
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getMyReservations = async (req, res) => {

    try {

        const filter = {
            borrower: req.user._id
        };

        if (req.query.status)
            filter.status = req.query.status;

        const reservations = await Reservation.find(filter)
            .populate("resource", "title images location")
            .populate("owner", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reservations.length,
            reservations
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getOwnerReservations = async (req, res) => {

    try {

        const filter = {
            owner: req.user._id
        };

        if (req.query.status)
            filter.status = req.query.status;

        const reservations = await Reservation.find(filter)
            .populate("resource", "title images")
            .populate("borrower", "name email profileImage")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reservations.length,
            reservations
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

/* ===================================
   Reservation Views
=================================== */

const renderReservationForm = async (req, res) => {

    try {

        const resource = await Resource.findById(req.params.id)
            .populate("owner", "name email")
            .populate("category", "name");

        if (!resource || resource.isDeleted) {
            return res.status(404).render("404", {
                title: "Resource Not Found",
                currentPage: "/resources",
                user: req.user || null
            });
        }

        if (resource.owner._id.toString() === req.user._id.toString()) {
            req.flash("error", "You cannot reserve your own resource.");
            return res.redirect(`/resources/${resource._id}`);
        }

        if (resource.availabilityStatus !== "Available") {
            req.flash("error", "Resource is currently unavailable.");
            return res.redirect(`/resources/${resource._id}`);
        }

        res.render("reservations/new", {
            title: "Reserve Resource",
            currentPage: "/resources",
            resource,
            user: req.user
        });

    } catch (error) {

        console.error(error);

        req.flash("error", "Something went wrong.");

        res.redirect("/resources");

    }

};

// const createReservationView = async (req, res) => {

//     try {

//         await createReservation(req, {
//             status: () => ({
//                 json: (data) => {

//                     if (data.success) {

//                         req.flash(
//                             "success",
//                             "Reservation request submitted successfully."
//                         );

//                         return res.redirect("/reservations/success");
//                     }

//                     req.flash("error", data.message);

//                     return res.redirect(`/resources/${req.params.id}`);

//                 }
//             })
//         });

//     } catch (error) {

//         console.error(error);

//         req.flash("error", "Unable to submit reservation.");

//         res.redirect(`/resources/${req.params.id}`);

//     }

// };

const createReservationView = async (req, res) => {

    try {

        const { error } = createReservationSchema.validate(req.body);

        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        const { startDate, endDate, remarks } = req.body;

        const resource = await Resource.findById(req.params.id);

        if (!resource || resource.isDeleted) {
            return res.status(404).send("Resource not found.");
        }

        if (resource.owner.toString() === req.user._id.toString()) {
            return res.status(400).send("You cannot reserve your own resource.");
        }

        if (
            resource.availableQuantity <= 0 ||
            resource.availabilityStatus !== "Available"
        ) {
            return res.status(400).send("Resource is unavailable.");
        }

        const overlap = await Reservation.findOne({
            resource: resource._id,
            status: "Approved",
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        });

        if (overlap) {
            return res.status(409).send(
                "Resource already reserved for these dates."
            );
        }

        const reservation = await Reservation.create({
            resource: resource._id,
            borrower: req.user._id,
            owner: resource.owner,
            startDate,
            endDate,
            remarks
        });
        await Notification.create({
            receiver: resource.owner,
            sender: req.user._id,
            type: "reservation_request",
            message: `${req.user.name} requested your resource "${resource.title}".`,
            resource: resource._id,
            reservation: reservation._id
        });

        return res.redirect(`/resources/${resource._id}`);

    } catch (error) {

        return res.status(500).send(error.message);

    }

};
const renderMyReservationsPage = async (req, res) => {

    try {

        const reservations = await Reservation.find({
            borrower: req.user._id
        })
            .populate("resource", "title images location")
            .populate("owner", "name email")
            .sort({ createdAt: -1 });

        res.render("reservations/index", {
            title: "My Reservations",
            currentPage: "/reservations",
            reservations
        });

    } catch (error) {

        return res.status(500).send(error.message);

    }

};
const renderOwnerReservationsPage = async (req, res) => {
    console.log("Logged in user:", req.user._id);

const reservations = await Reservation.find({
    owner: req.user._id
})
.populate("resource", "title images location")
.populate("borrower", "name email")
.sort({ createdAt: -1 });

console.log("Reservations found:", reservations.length);
console.log(reservations);

    try {

        const reservations = await Reservation.find({
            owner: req.user._id
        })
            .populate("resource", "title images location")
            .populate("borrower", "name email")
            .sort({ createdAt: -1 });

        res.render("reservations/owner", {
            title: "Reservation Requests",
            currentPage: "/owner/reservations",
            reservations
        });

    } catch (error) {

        return res.status(500).send(error.message);

    }

};
const renderReservationDetailsPage = async (req, res) => {

    try {

        const reservation = await Reservation.findById(req.params.id)
            .populate("resource")
            .populate("borrower", "name email department year")
            .populate("owner", "name email");

        if (!reservation) {
            return res.status(404).send("Reservation not found.");
        }

        const userId = req.user._id.toString();

        if (
            reservation.borrower._id.toString() !== userId &&
            reservation.owner._id.toString() !== userId &&
            req.user.role !== "admin"
        ) {
            return res.status(403).send("Access denied.");
        }

        res.render("reservations/show", {
            title: "Reservation Details",
            currentPage: "/reservations",
            reservation,
            user: req.user
        });

    } catch (error) {

        return res.status(500).send(error.message);

    }

};

module.exports = {
    createReservation,
    approveReservation,
    rejectReservation,
    cancelReservation,
    getReservation,
    getReservations,
    getMyReservations,
    getOwnerReservations,
    renderReservationForm,
    createReservationView,
    renderMyReservationsPage,
    renderOwnerReservationsPage,
    renderReservationDetailsPage
};