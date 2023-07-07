const express = require("express");
const router = express.Router();
const { isLoggedIn, isAuthor, validateCampground } = require("../middelware");

const catchAsync = require("../utils/catchAsync");
const Campground = require("../models/campground");

const campgrounds = require("../controllers/campgrounds");

router.get("/", catchAsync(campgrounds.index));

router.post("/", isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground));

router.get("/new", isLoggedIn, campgrounds.showNewForm);

router.get("/:id", catchAsync(campgrounds.showCampground));

router.put(
  "/:id",
  isLoggedIn,
  isAuthor,
  validateCampground,
  catchAsync(campgrounds.updateCampground)
);

router.delete("/:id", isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get("/:id/edit", isLoggedIn, isAuthor, catchAsync(campgrounds.showEditForm));

module.exports = router;
