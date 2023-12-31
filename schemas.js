const Joi = require("joi");

const campgroundSchema = Joi.object({
  campground: Joi.object({
    title: Joi.string().required(),
    // image: Joi.string().required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().required(),
    location: Joi.string().required()
  }).required(),
  deleteImages: Joi.array()
});

const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required()
  }).required()
});

module.exports = { campgroundSchema, reviewSchema };
