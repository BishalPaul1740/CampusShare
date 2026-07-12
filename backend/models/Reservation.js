// const mongoose = require("mongoose");

// const reservationSchema = new mongoose.Schema(
//     {
//         resource: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Resource",
//             required: true
//         },

//         borrower: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true
//         },

//         owner: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true
//         },

//         startDate: {
//             type: Date,
//             required: true
//         },

//         endDate: {
//             type: Date,
//             required: true
//         },

//         actualReturnDate: {
//             type: Date,
//             default: null
//         },

//         status: {
//             type: String,
//             enum: [
//                 "Pending",
//                 "Approved",
//                 "Rejected",
//                 "Borrowed",
//                 "Returned",
//                 "Cancelled"
//             ],
//             default: "Pending"
//         },

//         pickupLocation: {
//             type: String,
//             trim: true,
//             maxlength: 100,
//             default: ""
//         },

//         notes: {
//             type: String,
//             trim: true,
//             maxlength: 500,
//             default: ""
//         }
//     },
//     {
//         timestamps: true
//     }
// );

// /*-------------------------
//         INDEXES
// --------------------------*/

// reservationSchema.index({ resource: 1 });

// reservationSchema.index({ borrower: 1 });

// reservationSchema.index({ owner: 1 });

// reservationSchema.index({ status: 1 });

// reservationSchema.index({ startDate: 1 });

// reservationSchema.index({
//     borrower: 1,
//     status: 1
// });

// reservationSchema.index({
//     owner: 1,
//     status: 1
// });

// module.exports = mongoose.model("Reservation", reservationSchema);

const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
    resource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
        required: true
    },
    borrower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: [
            "Pending",
            "Approved",
            "Rejected",
            "Cancelled",
            "Completed"
        ],
        default: "Pending"
    },
    remarks: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    },
    approvedAt: {
        type: Date,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

/* Indexes */

reservationSchema.index({ resource: 1 });

reservationSchema.index({ borrower: 1 });

reservationSchema.index({ owner: 1 });

reservationSchema.index({ status: 1 });

reservationSchema.index({ startDate: 1 });

reservationSchema.index({
    resource: 1,
    startDate: 1,
    endDate: 1
});

module.exports = mongoose.model("Reservation", reservationSchema);