require("dotenv").config();

const connectDB = require("../config/db");

const seedCategories = require("./categorySeeder");

const runSeeder = async () => {
    try {

        await connectDB();

        console.log("Connected to MongoDB");

        await seedCategories();

        console.log("Database seeding completed.");

        process.exit(0);

    } catch (error) {

        console.error(error);

        process.exit(1);

    }
};

runSeeder();