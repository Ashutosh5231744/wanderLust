const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,

  // 🔥 FIX HERE
  image: {
  type: String,
  default: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157"
},

  price: Number,
  location: String,
  country: String,

  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

module.exports = mongoose.model("Listing", listingSchema);