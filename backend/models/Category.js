const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true,
            maxlength: 50
        },
        

        description: {
            type: String,
            trim: true,
            maxlength: 250,
            default: ""
        },

        icon: {
            type: String,
            default: ""
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

/* Index */

// categorySchema.index({ name: 1 });

module.exports = mongoose.model("Category", categorySchema);