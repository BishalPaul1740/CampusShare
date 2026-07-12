const Resource = require("../models/Resource");
const User = require("../models/User");

const Category = require("../models/Category");

const cloudinary = require("../config/cloudinary");

const {
    createResourceSchema,
    updateResourceSchema
} = require("../validators/resourceValidator");

const createResource = async (req, res) => {

    try {

        // Validation
        const { error } = createResourceSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        // Extract Request Body

        const {
            title,
            description,
            category,
            location,
            deposit,
            quantity,
            availableQuantity,
            condition,
            availabilityStatus,
            tags
        } = req.body;

        // Upload Images
        const images = [];

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const result = await cloudinary.uploader.upload(
                    file.path,
                    {
                        folder: "CampusShare/Resources"
                    }
                );

                images.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });

            }

        }

        // Create Resource
        const resource = await Resource.create({

            title,
            description,
            category,

            owner: req.user._id,

            images,

            location,

            deposit,

            quantity,

            availableQuantity:
                availableQuantity || quantity,

            condition,

            availabilityStatus,

            tags

        });

        // Update User

        req.user.createdResources.push(resource._id);

        await req.user.save();

        // Response

        return res.status(201).json({
            success: true,
            message: "Resource created successfully.",
            resource
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getResources = async (req, res) => {

    try {

        // Pagination

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        // Build Filter

        const filter = {
            isDeleted: false
        };

        // Search

        if (req.query.search) {
            filter.$text = {
                $search: req.query.search
            };
        }

        // Category

        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Availability

        if (req.query.status) {
            filter.availabilityStatus = req.query.status;
        }

        // Condition

        if (req.query.condition) {
            filter.condition = req.query.condition;
        }

        // Sorting

        let sortOption = {
            createdAt: -1
        };

        switch (req.query.sort) {

            case "oldest":
                sortOption = {
                    createdAt: 1
                };
                break;

            case "title":
                sortOption = {
                    title: 1
                };
                break;

            case "latest":
            default:
                sortOption = {
                    createdAt: -1
                };
        }

        // Fetch Resources

        const resources = await Resource.find(filter)
            .populate("owner", "name email profileImage")
            .populate("category", "name")
            .skip(skip)
            .limit(limit)
            .sort(sortOption);

        // Count Documents

        const totalResources = await Resource.countDocuments(filter);

        return res.status(200).json({
            success: true,
            count: resources.length,
            totalResources,
            currentPage: page,
            totalPages: Math.ceil(totalResources / limit),
            resources
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getResourceById = async (req, res) => {

    try {

        const resource = await Resource.findOneAndUpdate(

            {
                _id: req.params.id,
                isDeleted: false
            },

            {
                $inc: {
                    viewCount: 1
                }
            },

            {
                new: true
            })
            .populate("owner", "name email department year profileImage")
            .populate("category", "name description icon");

        if (!resource) {

            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });

        }

        return res.status(200).json({
            success: true,
            resource
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getSimilarResources = async (req, res) => {

    try {

        // Find current resource

        const currentResource = await Resource.findById(req.params.id);

        if (!currentResource) {

            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });

        }

        // Find similar resources

        const resources = await Resource.find({

            category: currentResource.category,

            _id: {
                $ne: currentResource._id
            },

            isDeleted: false

        })

            .populate("owner", "name profileImage")

            .populate("category", "name")

            .limit(4)

            .sort({
                createdAt: -1
            });

        return res.status(200).json({

            success: true,

            count: resources.length,

            resources

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const updateResource = async (req, res) => {

    try {

        // Validate

        const { error } = updateResourceSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        // Find Resource

        const resource = await Resource.findOne({

            _id: req.params.id,

            isDeleted: false

        });

        if (!resource) {

            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });

        }

        // Owner Check

        if (resource.owner.toString() !== req.user._id.toString()) {

            return res.status(403).json({
                success: false,
                message: "Only the owner can update this resource."
            });

        }

        // Update Images

        if (req.files && req.files.length > 0) {

            // Delete old Cloudinary images

            for (const image of resource.images) {

                await cloudinary.uploader.destroy(image.public_id);

            }

            const images = [];

            // Upload new images

            for (const file of req.files) {

                const result = await cloudinary.uploader.upload(
                    file.path,
                    {
                        folder: "CampusShare/Resources"
                    }
                );

                images.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });

            }

            resource.images = images;

        }

        // Update Fields

        resource.title = req.body.title ?? resource.title;

        resource.description = req.body.description ?? resource.description;

        resource.category = req.body.category ?? resource.category;

        resource.location = req.body.location ?? resource.location;

        resource.deposit = req.body.deposit ?? resource.deposit;

        resource.quantity = req.body.quantity ?? resource.quantity;

        resource.availableQuantity =
            req.body.availableQuantity ?? resource.availableQuantity;

        resource.condition =
            req.body.condition ?? resource.condition;

        resource.availabilityStatus =
            req.body.availabilityStatus ?? resource.availabilityStatus;

        resource.tags =
            req.body.tags ?? resource.tags;

        await resource.save();

        return res.status(200).json({

            success: true,

            message: "Resource updated successfully.",

            resource

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const deleteResource = async (req, res) => {

    try {

        // Find Resource

        const resource = await Resource.findOne({

            _id: req.params.id,

            isDeleted: false

        });

        if (!resource) {

            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });

        }

        // Owner Check

        if (resource.owner.toString() !== req.user._id.toString()) {

            return res.status(403).json({
                success: false,
                message: "Only the owner can delete this resource."
            });

        }

        // Soft Delete

        resource.isDeleted = true;

        resource.deletedAt = new Date();

        await resource.save();

        return res.status(200).json({

            success: true,

            message: "Resource deleted successfully."

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {
    createResource,
    getResources,
    getResourceById,
    getSimilarResources,
    updateResource,
    deleteResource
};