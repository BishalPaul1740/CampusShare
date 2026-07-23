// const mongoose = require("mongoose");

// const resourceSchema = new mongoose.Schema(
//     {
//         title: {
//             type: String,
//             required: [true, "Resource title is required"],
//             trim: true,
//             minlength: 3,
//             maxlength: 100
//         },

//         description: {
//             type: String,
//             required: [true, "Description is required"],
//             trim: true,
//             minlength: 10,
//             maxlength: 1000
//         },

//         images: [
//             {
//                 type: String,
//                 trim: true
//             }
//         ],

//         category: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Category",
//             required: true
//         },

//         owner: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true
//         },

//         condition: {
//             type: String,
//             enum: [
//                 "New",
//                 "Excellent",
//                 "Good",
//                 "Fair"
//             ],
//             default: "Good"
//         },

//         location: {
//             type: String,
//             required: true,
//             trim: true,
//             maxlength: 100
//         },

//         availabilityStatus: {
//             type: String,
//             enum: [
//                 "Available",
//                 "Reserved",
//                 "Unavailable"
//             ],
//             default: "Available"
//         },

//         depositAmount: {
//             type: Number,
//             default: 0,
//             min: 0
//         },

//         dailyRate: {
//             type: Number,
//             default: 0,
//             min: 0
//         },

//         quantity: {
//             type: Number,
//             required: true,
//             min: 1,
//             default: 1
//         },

//         availableQuantity: {
//             type: Number,
//             required: true,
//             min: 0,
//             default: 1
//         },

//         tags: [
//             {
//                 type: String,
//                 trim: true,
//                 lowercase: true
//             }
//         ],

//         views: {
//             type: Number,
//             default: 0
//         },

//         favorites: {
//             type: Number,
//             default: 0
//         },

//         averageRating: {
//             type: Number,
//             default: 0,
//             min: 0,
//             max: 5
//         },

//         ratingCount: {
//             type: Number,
//             default: 0
//         },

//         isApproved: {
//             type: Boolean,
//             default: true
//         },

//         isDeleted: {
//             type: Boolean,
//             default: false
//         }
//     },
//     {
//         timestamps: true
//     }
// );

// /*-------------------------
//         INDEXES
// --------------------------*/

// // Frequently queried fields
// resourceSchema.index({ owner: 1 });

// resourceSchema.index({ category: 1 });

// resourceSchema.index({ availabilityStatus: 1 });

// resourceSchema.index({ createdAt: -1 });

// // Compound index
// resourceSchema.index({
//     category: 1,
//     availabilityStatus: 1
// });

// // Text Search
// resourceSchema.index({
//     title: "text",
//     description: "text",
//     tags: "text"
// });

// module.exports = mongoose.model("Resource", resourceSchema);


const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: 3,
            maxlength: 100
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            minlength: 10,
            maxlength: 1000
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        images: [
            {
                url: {
                    type: String,
                    required: true
                },
                public_id: {
                    type: String,
                    required: true
                }
            }
        ],

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        deposit: {
            type: Number,
            default: 0,
            min: 0
        },

        quantity: {
            type: Number,
            default: 1,
            min: 1
        },

        availableQuantity: {
            type: Number,
            default: 1,
            min: 0
        },

        condition: {
            type: String,
            enum: [
                "New",
                "Excellent",
                "Good",
                "Fair"
            ],
            default: "Good"
        },

        availabilityStatus: {
            type: String,
            enum: [
                "Available",
                "Unavailable",
                "Maintenance"
            ],
            default: "Available"
        },

        tags: [
            {
                type: String,
                trim: true,
                lowercase: true
            }
        ],

        ratingsAverage: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        ratingsCount: {
            type: Number,
            default: 0
        },

        viewCount: {
            type: Number,
            default: 0
        },

        isDeleted: {
            type: Boolean,
            default: false
        },

        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

resourceSchema.index({ title: "text", description: "text", tags: "text" });

resourceSchema.index({ category: 1 });

resourceSchema.index({ owner: 1 });

resourceSchema.index({ availabilityStatus: 1 });

resourceSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("Resource", resourceSchema);