const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;

const CampgroundSchema = new Schema({
  title: { type: String, required: true },
  images: [
    {
      url: String,
      filename: String
    }
  ],
  price: { type: Number, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review"
    }
  ]
});

CampgroundSchema.post("findOneAndDelete", async (doc) => {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews
      }
    });
  }
});

module.exports = mongoose.model("Campground", CampgroundSchema);
