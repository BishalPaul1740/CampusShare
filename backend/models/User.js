const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 3,
            maxlength: 50
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please enter a valid email"
            ]
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 3,
            select: false
        },

        rollNumber: {
            type: String,
            required: [true, "Roll number is required"],
            unique: true,
            trim: true,
            uppercase: true
        },

        department: {
            type: String,
            required: true,
            enum: [
                "CSE",
                "ECE",
                "EEE",
                "ME",
                "CE",
                "CHE",
                "MME",
                "BIO",
                "MCA",
                "MBA",
                "OTHER"
            ]
        },

        year: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        phone: {
            type: String,
            trim: true,
            match: [/^[6-9]\d{9}$/, "Invalid phone number"]
        },

        profileImage: {
            url: {
                type: String,
                default: ""
            },
            public_id: {
                type: String,
                default: ""
            }
        },

        bio: {
            type: String,
            trim: true,
            maxlength: 250,
            default: ""
        },

        role: {
            type: String,
            enum: ["student", "admin"],
            default: "student"
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        createdResources: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Resource"
            }
        ],

        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Resource"
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
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

/* Indexes */

// userSchema.index({ email: 1 });

// userSchema.index({ rollNumber: 1 });

userSchema.index({ role: 1 });

userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);

    // next();

});

userSchema.methods.comparePassword = async function (enteredPassword) {

    return await bcrypt.compare(
        enteredPassword,
        this.password
    );

};

module.exports = mongoose.model("User", userSchema);