const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        type: {
            type: String,
            enum: [
                "reservation_request",
                "reservation_approved",
                "reservation_rejected",
                "return_reminder",
                "review",
                "report"
            ],
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        isRead: {
            type: Boolean,
            default: false
        },

        resource: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resource",
            default: null
        },

        reservation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation",
            default: null
        }
    },
    {
        timestamps: true
    }
);

/*-------------------------
        INDEXES
--------------------------*/

notificationSchema.index({ receiver: 1 });

notificationSchema.index({ isRead: 1 });

notificationSchema.index({
    receiver: 1,
    isRead: 1
});

module.exports = mongoose.model("Notification", notificationSchema);