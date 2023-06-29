const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const AppError = require("./utils/ExpressError");
const catchAsync = require("./utils/catchAsync");
const { campgroundSchema, reviewSchema } = require("./schemas");
const Campground = require("./models/campground");
const Review = require("./models/review");

async function connectDataBase() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  } catch (error) {
    console.log(error);
  }
}
connectDataBase();

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
    type: "application/x-www-form-urlencoded"
  })
);
app.use(express.json());

const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);

  if (error) {
    const msg = error.details.map((err) => err.message);
    throw new AppError(msg, 400);
  } else {
    next();
  }
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    const msg = error.details.map((err) => err.message);
    throw new AppError(msg, 400);
  } else {
    next();
  }
};

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/campgrounds",
  catchAsync(async (req, res, next) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", { campgrounds });
  })
);

app.post(
  "/campgrounds",
  validateCampground,
  catchAsync(async (req, res, next) => {
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
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate("reviews");
    if (!campground) {
      throw next(new AppError("Campground Not Found", 401));
    }

    res.render("campgrounds/show", { campground });
  })
);

app.put(
  "/campgrounds/:id",
  validateCampground,
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    await Campground.findByIdAndUpdate(id, req.body.campground, {
      runValidators: true
    });
    res.redirect(`/campgrounds/${id}`);
  })
);

app.delete(
  "/campgrounds/:id",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect(`/campgrounds`);
  })
);

app.get(
  "/campgrounds/:id/edit",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground) {
      throw next(new AppError("Campground Not Found", 401));
    }

    res.render("campgrounds/edit", { campground });
  })
);

app.post(
  "/campgrounds/:id/reviews",
  validateReview,
  catchAsync(async (req, res, next) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

app.delete(
  "/campgrounds/:id/reviews/:reviewId",
  catchAsync(async (req, res, next) => {
    await Review.findByIdAndDelete(req.params.reviewId);
    const campground = await Campground.findById(req.params.id).populate("reviews");
    const reviews = campground.reviews.filter((review) => {
      return review._id !== req.params.reviewId;
    });

    campground.reviews = reviews;
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

const handleValidationError = () => {
  return new AppError("Validation Failed", 400);
};

const handleCastError = () => {
  return new AppError("Cast Error", 400);
};

app.use("*", (req, res, next) => {
  next(new AppError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  console.dir(err);
  next(err);
});

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") err = handleValidationError();
  if (err.name === "CastError") err = handleCastError();
  next(err);
});

app.use((err, req, res, next) => {
  const { status = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(status).render("error", { err });
});

app.listen(3000, () => {
  console.log("Serving on port 3000");
});
