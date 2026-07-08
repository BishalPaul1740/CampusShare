const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        resource: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resource",
            required: true
        },

        reason: {
            type: String,
            enum: [
                "Spam",
                "Fake Listing",
                "Damaged Resource",
                "Inappropriate Content",
                "Fraud",
                "Other"
            ],
            required: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            required: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Investigating",
                "Resolved",
                "Rejected"
            ],
            default: "Pending"
        },

        adminRemark: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

/*-------------------------
        INDEXES
--------------------------*/

reportSchema.index({ status: 1 });

reportSchema.index({ resource: 1 });

reportSchema.index({ reporter: 1 });

reportSchema.index({
    reporter: 1,
    resource: 1
});

module.exports = mongoose.model("Report", reportSchema);