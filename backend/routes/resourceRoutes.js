const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const { isLoggedIn } = require("../middleware/authMiddleware");

const {
    createResource,
    getResources,
    getResourceById,
    getSimilarResources,
    updateResource,
    deleteResource
} = require("../controllers/resourceController");

router.get("/", getResources);

router.get("/:id/similar", getSimilarResources);

router.get("/:id", getResourceById);

router.post(
    "/",
    isLoggedIn,
    upload.array("images", 5),
    createResource
);

router.put(
    "/:id",
    isLoggedIn,
    upload.array("images", 5),
    updateResource
);

router.delete(
    "/:id",
    isLoggedIn,
    deleteResource
);

module.exports = router;