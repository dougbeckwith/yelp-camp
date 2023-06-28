const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Campground = require("./models/campground");
const methodOverride = require("method-override");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");

async function connectDataBase() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.log(error);
  }
}
connectDataBase();

class AppError extends Error {
  constructor(message, status) {
    super();
    this.message = message;
    this.status = status;
  }
}

// Avoid writing try catch every async function
function wrapAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((error) => {
      next(error);
    });
  };
}

const db = mongoose.connection;

db.on("error", (error) => {
  console.log(error);
});

db.on("open", () => {
  console.log("Database conncted");
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(methodOverride("_method"));
app.use(morgan("dev"));

app.use(
  express.urlencoded({
    extended: true,
    type: "application/x-www-form-urlencoded",
  })
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/campgrounds",
  wrapAsync(async (req, res, next) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", { campgrounds });
  })
);

app.post(
  "/campgrounds",
  wrapAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

app.get("/campgrounds/new", (req, res) => {
  res.render("campgrounds/new");
});

app.get(
  "/campgrounds/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
      throw next(new AppError("Campground Not Found", 401));
    }
    res.render("campgrounds/show", { campground });
  })
);

app.put(
  "/campgrounds/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    await Campground.findByIdAndUpdate(id, req.body.campground, {
      runValidators: true,
    });
    res.redirect(`/campgrounds/${id}`);
  })
);

app.delete(
  "/campgrounds/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect(`/campgrounds`);
  })
);

app.get(
  "/campgrounds/:id/edit",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
      throw next(new AppError("Campground Not Found", 401));
    }
    res.render("campgrounds/edit", { campground });
  })
);

const handleValidationError = (error) => {
  return new AppError("Validation Failed", 400);
};

const handleCastError = (error) => {
  return new AppError("Cast Error", 400);
};

// First Error Handler
app.use((err, req, res, next) => {
  console.log(err);
  next(err);
});

// Log Error name
app.use((err, req, res, next) => {
  console.dir(err);
  next(err);
});

// Check Error Type
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") err = handleValidationError(err);
  if (err.name === "CastError") err = handleCastError(err);
  next(err);
});

// Second Error Handler
app.use((err, req, res, next) => {
  const { status = 500, message = "Opps Something Went Wrong" } = err;
  res.status(status).send(message);
});

app.listen(3000, () => {
  console.log("Serving on port 3000");
});
