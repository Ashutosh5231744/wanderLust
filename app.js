const multer = require("multer");
const { storage } = require("./cloudConfig");
const upload = multer({ storage });
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const Review = require("./models/review");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderLust";

// ---------------- DB CONNECT ----------------
async function main() {
  await mongoose.connect(MONGO_URL);
}
main()
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log(err));

// ---------------- EJS SETUP ----------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------------- MIDDLEWARE ----------------
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// SESSION
app.use(session({
  secret: "mysupersecret",
  resave: false,
  saveUninitialized: true,
}));

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// GLOBAL USER
app.use((req, res, next) => {
  res.locals.currUser = req.user;
  next();
});

// ---------------- AUTH MIDDLEWARE ----------------
function isLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  next();
}

async function isOwner(req, res, next) {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) return res.send("Listing not found");

  if (!listing.owner || !listing.owner.equals(req.user._id)) {
    return res.send("You are not the owner!");
  }

  next();
}

// ---------------- ROUTES ----------------

// Home
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// INDEX
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
});

// NEW
app.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

// 🔥 SHOW (UPDATED WITH POPULATE)
app.get("/listings/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      }
    })
    .populate("owner");

  res.render("listings/show.ejs", { listing });
});


// CREATE (🔥 IMAGE UPLOAD ENABLED)
app.post("/listings", isLoggedIn, async (req, res) => {
  try {
    const newListing = new Listing({
      title: req.body.listing.title,
      description: req.body.listing.description,
      price: req.body.listing.price,
      location: req.body.listing.location,
      country: req.body.listing.country,

      // 🔥 YE LINE MISSING THI
      image: req.body.listing.image,

      owner: req.user._id,
    });

    await newListing.save();
    res.redirect("/listings");

  } catch (err) {
    console.log(err);
  }
});

// EDIT
app.get("/listings/:id/edit", isLoggedIn, isOwner, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  res.render("listings/edit.ejs", { listing });
});

// UPDATE
app.put("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
  await Listing.findByIdAndUpdate(req.params.id, req.body.listing);
  res.redirect(`/listings/${req.params.id}`);
});

// DELETE
app.delete("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  res.redirect("/listings");
});

// 🔥 ADD REVIEW
app.post("/listings/:id/reviews", isLoggedIn, async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  const newReview = new Review(req.body.review);
  newReview.author = req.user._id;

  await newReview.save();

  listing.reviews.push(newReview);
  await listing.save();

  res.redirect(`/listings/${listing._id}`);
});

// ---------------- AUTH ----------------

// Signup
app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

app.post("/signup", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const newUser = new User({ username });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      res.redirect("/listings");
    });

  } catch (err) {
    res.send(err.message);
  }
});

// Login
app.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

app.post("/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/listings");
  }
);

// Logout
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/listings");
  });
});

// ---------------- PORT ----------------
const PORT = 7000;
app.listen(PORT, () => {
  console.log(`🚀 server running on port ${PORT}`);
});