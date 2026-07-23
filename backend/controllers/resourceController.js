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
const renderResourcesPage = async (req, res) => {
    try {
        const {
            search,
            category,
            availability,
            sort,
            page
        } = req.query;
        const filter = {
            isDeleted: false
        };
        // ===============================
        // Search (Title, Description, Tags, Category)
        // ===============================
        if (search && search.trim() !== "") {
            const matchingCategories = await Category.find({
                name: {
                    $regex: search.trim(),
                    $options: "i"
                }
            }).select("_id");
            const categoryIds = matchingCategories.map(c => c._id);
            filter.$or = [
                {
                    $text: {
                        $search: search.trim()
                    }
                },
                {
                    category: {
                        $in: categoryIds
                    }
                }
            ];
        }
        // ===============================
        // Category Filter
        // ===============================
        if (category && category !== "") {
            const selectedCategory = await Category.findOne({
                name: category
            });
            if (selectedCategory) {
                filter.category = selectedCategory._id;
            }
        }
        // ===============================
        // Availability Filter
        // ===============================
        if (availability && availability !== "") {
            filter.availabilityStatus = availability;
        }
        let sortOption = {
            createdAt: -1
        };

        switch (sort) {

            case "oldest":
                sortOption = {
                    createdAt: 1
                };
                break;

            case "titleAsc":
                sortOption = {
                    title: 1
                };
                break;

            case "titleDesc":
                sortOption = {
                    title: -1
                };
                break;

            case "depositAsc":
                sortOption = {
                    deposit: 1
                };
                break;

            case "depositDesc":
                sortOption = {
                    deposit: -1
                };
                break;

        }
        const currentPage = parseInt(page) || 1;
        const limit = 8;
        const skip = (currentPage - 1) * limit;
        const totalResources = await Resource.countDocuments(filter);
        const totalPages = Math.ceil(totalResources / limit);
        const resources = await Resource.find(filter)
            .populate("owner", "name")
            .populate("category", "name")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);
        const categories = await Category.find().sort({
            name: 1
        });
        res.render("resources/index", {
            title: "Resources",
            currentPage: "/resources",

            resources,
            categories,

            search: search || "",
            selectedCategory: category || "",
            selectedAvailability: availability || "",
            selectedSort: sort || "",

            currentPageNumber: currentPage,
            totalPages,
            query: req.query
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

const renderResourceDetailsPage = async (req, res) => {

    try {

        const resource = await Resource.findOne({
            _id: req.params.id,
            isDeleted: false
        })
            .populate("owner", "name email profileImage")
            .populate("category", "name");

        if (!resource) {
            return res.status(404).render("pages/404", {
                title: "Resource Not Found",
                currentPage: ""
            });
        }

        res.render("resources/show", {
            title: resource.title,
            currentPage: "/resources",
            resource,
            user: req.user || null
        });

    } catch (error) {

        return res.status(500).send(error.message);

    }

};

const renderCreateResourcePage = async (req, res) => {

    try {

        const categories = await Category.find({
            isActive: true
        }).sort({
            name: 1
        });

        res.render("resources/new", {
            title: "Create Resource",
            currentPage: "/resources",
            categories
        });

    } catch (error) {

        return res.status(500).send(error.message);

    }

};


const createResourceView = async (req, res) => {

    try {

        // Validation
        const { error } = createResourceSchema.validate(req.body);

        if (error) {
            return res.status(400).send(error.details[0].message);
        }

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

        const images = [];

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const result =
                    await cloudinary.uploader.upload(
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
        let formattedTags = [];

        if (typeof tags === "string" && tags.trim() !== "") {
            formattedTags = tags
                .split(",")
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag.length > 0);
        } else if (Array.isArray(tags)) {
            formattedTags = tags;
        }

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

            tags: formattedTags

        });

        req.user.createdResources.push(resource._id);

        await req.user.save();

        return res.redirect("/resources");

    } catch (error) {

        return res.status(500).send(error.message);

    }

};

const renderEditResourcePage = async (req, res) => {

    try {

        const resource = await Resource.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!resource) {
            return res.status(404).send("Resource not found.");
        }

        if (resource.owner.toString() !== req.user._id.toString()) {
            return res.status(403).send("Access denied.");
        }

        const categories = await Category.find({
            isActive: true
        }).sort({ name: 1 });

        res.render("resources/edit", {
            title: "Edit Resource",
            currentPage: "/resources",
            resource,
            categories
        });

    } catch (error) {

        return res.status(500).send(error.message);

    }

};


const updateResourceView = async (req, res) => {

    try {

        const { error } = updateResourceSchema.validate(req.body);

        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        const resource = await Resource.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!resource) {
            return res.status(404).send("Resource not found.");
        }

        if (resource.owner.toString() !== req.user._id.toString()) {
            return res.status(403).send("Access denied.");
        }

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

        resource.title = title;
        resource.description = description;
        resource.category = category;
        resource.location = location;
        resource.deposit = deposit;
        resource.quantity = quantity;
        resource.availableQuantity = availableQuantity;
        resource.condition = condition;
        resource.availabilityStatus = availabilityStatus;

        let formattedTags = [];

        if (typeof tags === "string" && tags.trim() !== "") {

            formattedTags = tags
                .split(",")
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag.length > 0);

        } else if (Array.isArray(tags)) {
            formattedTags = tags;
        }
        resource.tags = formattedTags;

        if (req.files && req.files.length > 0) {

            for (const image of resource.images) {
                await cloudinary.uploader.destroy(image.public_id);
            }

            const images = [];

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
        await resource.save();
        return res.redirect(`/resources/${resource._id}`);
    } catch (error) {
        return res.status(500).send(error.message);
    }

};

module.exports = {
    createResource,
    getResources,
    getResourceById,
    getSimilarResources,
    updateResource,
    deleteResource,
    renderResourcesPage,
    renderResourceDetailsPage,
    renderCreateResourcePage,
    createResourceView,
    renderEditResourcePage,
    updateResourceView
};