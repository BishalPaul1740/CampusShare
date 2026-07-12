const Reservation = require("../models/Reservation");
const Resource = require("../models/Resource");

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

        return res.status(200).json({
            success: true,
            message: "Reservation approved.",
            reservation
        });

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

        return res.status(200).json({
            success: true,
            message: "Reservation rejected.",
            reservation
        });

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

module.exports = {
    createReservation,
    approveReservation,
    rejectReservation,
    cancelReservation,
    getReservation,
    getReservations,
    getMyReservations,
    getOwnerReservations
};