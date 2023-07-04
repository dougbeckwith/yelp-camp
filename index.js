const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const AppError = require("./utils/ExpressError");

const campgrounds = require("./routes/campgrounds");
const reviews = require("./routes/reviews");

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
app.use(express.static(path.join(__dirname, "public")));

app.use(
  express.urlencoded({
    extended: true,
    type: "application/x-www-form-urlencoded"
  })
);
app.use(express.json());

app.use("/campgrounds", campgrounds);
app.use("/campgrounds/:id/reviews", reviews);

app.get("/", (req, res) => {
  res.render("home");
});

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
