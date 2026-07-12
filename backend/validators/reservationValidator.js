const Joi = require("joi");

/* ===========================
   Create Reservation
=========================== */

const createReservationSchema = Joi.object({
    startDate: Joi.date()
        .required(),

    endDate: Joi.date()
        .greater(Joi.ref("startDate"))
        .required(),

    remarks: Joi.string()
        .trim()
        .max(500)
        .allow("")
});

/* ===========================
   Approve Reservation
=========================== */

const approveReservationSchema = Joi.object({
    remarks: Joi.string()
        .trim()
        .max(500)
        .allow("")
});

/* ===========================
   Reject Reservation
=========================== */

const rejectReservationSchema = Joi.object({
    remarks: Joi.string()
        .trim()
        .max(500)
        .required()
});

/* ===========================
   Cancel Reservation
=========================== */

const cancelReservationSchema = Joi.object({
    remarks: Joi.string()
        .trim()
        .max(500)
        .allow("")
});

module.exports = {
    createReservationSchema,
    approveReservationSchema,
    rejectReservationSchema,
    cancelReservationSchema
};