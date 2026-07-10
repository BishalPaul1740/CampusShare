const Joi = require("joi");

/* ===========================
   Register Validation
=========================== */

const registerSchema = Joi.object({

    name: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .required(),

    email: Joi.string()
        .trim()
        .email()
        .required(),

    password: Joi.string()
        .min(3)
        .required(),

    rollNumber: Joi.string()
        .trim()
        .uppercase()
        .required(),

    department: Joi.string()
        .valid(
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
        )
        .required(),

    year: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required(),

    phone: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .allow("")
        .optional(),

    bio: Joi.string()
        .max(250)
        .allow("")
        .optional()

});


/* ===========================
   Login Validation
=========================== */

const loginSchema = Joi.object({

    email: Joi.string()
        .trim()
        .email()
        .required(),

    password: Joi.string()
        .required()

});


module.exports = {

    registerSchema,
    loginSchema

};