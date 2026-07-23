const Joi = require("joi");

/* ===========================
   Create Resource Validation
=========================== */

const createResourceSchema = Joi.object({

    title: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required(),

    description: Joi.string()
        .trim()
        .min(10)
        .max(1000)
        .required(),

    category: Joi.string()
        .required(),

    location: Joi.string()
        .trim()
        .max(100)
        .required(),

    deposit: Joi.number()
        .min(0)
        .default(0),

    quantity: Joi.number()
        .integer()
        .min(1)
        .default(1),

    availableQuantity: Joi.number()
        .integer()
        .min(0)
        .optional(),

    condition: Joi.string()
        .valid(
            "New",
            "Excellent",
            "Good",
            "Fair"
        )
        .default("Good"),

    availabilityStatus: Joi.string()
        .valid(
            "Available",
            "Unavailable",
            "Maintenance"
        )
        .default("Available"),

    tags: Joi.alternatives().try(
        Joi.array().items(Joi.string().trim().lowercase()),
        Joi.string().allow("")
    ).optional()

});

/* ===========================
   Update Resource Validation
=========================== */

const updateResourceSchema = createResourceSchema.fork(
    Object.keys(createResourceSchema.describe().keys),
    (schema) => schema.optional()
);

module.exports = {
    createResourceSchema,
    updateResourceSchema
};