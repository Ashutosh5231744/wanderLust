const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1625505826533-5c80aca7d157",
  },
  price: Number,
  location: String,
  country: String,

  // 🔥 OWNER
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  // 🔥 IMPORTANT: REVIEWS (THIS WAS MISSING)
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    }
  ]
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;