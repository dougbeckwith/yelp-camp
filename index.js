const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Campground = require("./models/campground");

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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/campground", async (req, res) => {
  const camp = new Campground({
    title: "My Backyard",
    description: "cheap camping"
  });
  await camp.save();
  res.send(camp);
});

app.listen(3000, () => {
  console.log("Serving on port 3000");
});
