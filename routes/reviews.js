const express = require("express");
const router = express.Router({ mergeParams: true });
const isLoggedIn = require("../middelware");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/ExpressError");

const Campground = require("../models/campground");
const Review = require("../models/review");

const { reviewSchema } = require("../schemas");

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    const msg = error.details.map((err) => err.message);
    throw new AppError(msg, 400);
  } else {
    next();
  }
};

router.post(
  "/",
  isLoggedIn,
  validateReview,
  catchAsync(async (req, res, next) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash("success", "Created new review!");
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

router.delete(
  "/:reviewId",
  isLoggedIn,
  catchAsync(async (req, res, next) => {
    await Review.findByIdAndDelete(req.params.reviewId);
    const campground = await Campground.findById(req.params.id).populate("reviews");
    const reviews = campground.reviews.filter((review) => {
      return review._id !== req.params.reviewId;
    });
    campground.reviews = reviews;
    await campground.save();
    req.flash("success", "Successfully deleted review!");
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

module.exports = router;
