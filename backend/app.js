// const express = require("express");
// const morgan = require("morgan");
// const cookieParser = require("cookie-parser");
// const path = require("path");

// const notFound = require("./middleware/notFoundMiddleware");
// const errorHandler = require("./middleware/errorMiddleware");

// const app = express();

// const authRoutes = require("./routes/authRoutes");

// app.use("/api/auth", authRoutes);

// /*
// |--------------------------------------------------------------------------
// | Middlewares
// |--------------------------------------------------------------------------
// */

// app.use(express.json());

// app.use(
//     express.urlencoded({
//         extended: true,
//     })
// );

// app.use(cookieParser());

// if (process.env.NODE_ENV === "development") {
//     app.use(morgan("dev"));
// }

// /*
// |--------------------------------------------------------------------------
// | Static Folder
// |--------------------------------------------------------------------------
// */

// app.use(express.static(path.join(__dirname, "public")));

// /*
// |--------------------------------------------------------------------------
// | Routes
// |--------------------------------------------------------------------------
// */

// // Routes will be added here later

// // Health Check Route
// app.get("/", (req, res) => {
//     res.status(200).json({
//         success: true,
//         message: "CampusShare API is running",
//     });
// });

// /*
// |--------------------------------------------------------------------------
// | 404 Middleware
// |--------------------------------------------------------------------------
// */

// app.use(notFound);

// /*
// |--------------------------------------------------------------------------
// | Global Error Handler
// |--------------------------------------------------------------------------
// */

// app.use(errorHandler);

// module.exports = app;

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");

const app = express();

/*
|--------------------------------------------------------------------------
| Body Parsing Middleware
|--------------------------------------------------------------------------
*/

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Logger
|--------------------------------------------------------------------------
*/

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

/*
|--------------------------------------------------------------------------
| Static Folder
|--------------------------------------------------------------------------
*/

app.use(express.static(path.join(__dirname, "public")));

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CampusShare API is running",
    });
});

app.use("/api/auth", authRoutes);

/*
|--------------------------------------------------------------------------
| 404 Middleware
|--------------------------------------------------------------------------
*/

app.use(notFound);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

module.exports = app;