const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");

const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const resourceRoutes = require("./routes/resourceRoutes");

const expressLayouts = require("express-ejs-layouts");


const reservationRoutes = require("./routes/reservationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const Notification = require("./models/Notification");



const app = express();

/*
|--------------------------------------------------------------------------
| View Engine
|--------------------------------------------------------------------------
*/

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);

app.set("layout", "layouts/layout");

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

const jwt = require("jsonwebtoken");
const User = require("./models/User");

app.use(async (req, res, next) => {

    res.locals.currentUser = null;
    res.locals.unreadNotificationCount = 0;

    const token = req.cookies.token;

    if (!token) {
        return next();
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        res.locals.currentUser = user;

        if (user) {

            res.locals.unreadNotificationCount =
                await Notification.countDocuments({
                    receiver: user._id,
                    isRead: false
                });

        }

    } catch (error) {

        res.locals.currentUser = null;
        res.locals.unreadNotificationCount = 0;

    }

    next();

});

app.use(
    session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false
    })
);

app.use(flash());

app.use((req, res, next) => {

    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");

    next();

});

const viewRoutes = require("./routes/viewRoutes");
const authViewRoutes = require("./routes/authViewRoutes");

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
| View Routes
|--------------------------------------------------------------------------
*/

app.use("/", viewRoutes);

/*
|--------------------------------------------------------------------------
| View Auth Routes
|--------------------------------------------------------------------------
*/

app.use("/", authViewRoutes);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.get("/api", (req, res) => {

    res.status(200).json({
        success: true,
        message: "CampusShare API is running"
    });

});

app.use("/api/auth", authRoutes);

/*
|--------------
| api resources
|--------------
*/

app.use("/api/resources", resourceRoutes);

app.use("/api/reservations", reservationRoutes);

app.use("/api/notifications", notificationRoutes);
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