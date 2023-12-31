// importing packages
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

// import Routes
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const friendsRoutes = require("./routes/friends");

// dotend
const dotenv = require("dotenv");
dotenv.config();

// setup app
const app = express();

// using middlewares
app.use(express.json());
app.use(cors());

// configuring database
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("Database Connected"))
  .catch((err) =>
    console.log("Error Occured While Connecting Database " + err.message)
  );

// adding  server check route
app.get("/", (req, res) =>
  res.json({ success: true, message: "Main Server is Running Fine" })
);

// special route : will serve the special folder
app.use("/uploads", express.static("uploads"));

// adding external routes
app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);
app.use("/friends", friendsRoutes);

// startign app
let PORT;
if (process.env.PORT) {
  PORT = process.env.PORT;
} else {
  PORT = 8000;
}
app.listen(PORT, () => console.log(`Server is Running on PORT :  ${PORT}`));
