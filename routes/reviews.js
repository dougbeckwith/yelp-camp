const express = require("express");
const router = express.Router({ mergeParams: true });

const catchAsync = require("../utils/catchAsync");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middelware");

const Campground = require("../models/campground");
const Review = require("../models/review");

router.post(
  "/",
  isLoggedIn,
  validateReview,
  catchAsync(async (req, res, next) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
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
  isReviewAuthor,
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
