const Category = require("../models/Category");

const defaultCategories = [
    {
        name: "Books",
        description: "Books, notes and study materials",
        icon: "book"
    },
    {
        name: "Laptop",
        description: "Laptops and notebooks",
        icon: "laptop"
    },
    {
        name: "Camera",
        description: "DSLRs, action cameras and accessories",
        icon: "camera"
    },
    {
        name: "Projector",
        description: "Projectors and presentation equipment",
        icon: "projector"
    },
    {
        name: "Sports",
        description: "Sports equipment",
        icon: "volleyball"
    },
    {
        name: "Arduino",
        description: "Arduino boards and kits",
        icon: "cpu"
    },
    {
        name: "Electronics",
        description: "Electronic components and devices",
        icon: "cpu-fill"
    },
    {
        name: "Lab Equipment",
        description: "Laboratory instruments",
        icon: "tools"
    },
    {
        name: "Meeting Room",
        description: "Meeting rooms and collaboration spaces",
        icon: "people"
    }
];

const seedCategories = async () => {
    let inserted = 0;
    let skipped = 0;

    for (const category of defaultCategories) {
        const exists = await Category.findOne({
            name: category.name
        });

        if (exists) {
            skipped++;
            continue;
        }

        await Category.create(category);
        inserted++;
    }

    console.log("--------------------------------");
    console.log("Category Seeder Completed");
    console.log(`Inserted : ${inserted}`);
    console.log(`Skipped  : ${skipped}`);
    console.log("--------------------------------");
};

module.exports = seedCategories;