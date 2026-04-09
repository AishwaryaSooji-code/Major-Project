const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");
const User = require("./model/user");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Disable caching
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ----------------------
// PREDICTION DB CONNECT
// ----------------------
const url = 'mongodb://localhost:27017';
const dbName = 'sucrose_db';
let collection;

MongoClient.connect(url)
  .then(client => {
    console.log("✅ Prediction MongoDB Connected");

    const db = client.db(dbName);
    collection = db.collection('sucrose_data');

    app.listen(3000, () => {
      console.log("🚀 Server running on http://localhost:3000");
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

  mongoose
  .connect("mongodb://127.0.0.1:27017/signupDB")
  .then(() => console.log("✅ User MongoDB Connected"))
  .catch((err) => console.error(err));


// --------------------------------
// HOMEPAGE (after login)
// --------------------------------
app.get("/homepage", async (req, res) => {
  if (!loggedInEmail) return res.redirect("/auth");

  const data = await collection.find().sort({ timestamp: -1 }).toArray();
  res.render("homepage", { prediction: null, data });
});


// ----------------------
//  PREDICT ROUTE
// ----------------------
app.post("/predict", (req, res) => {
  const { observed_brix, observed_pol, temp } = req.body;

  exec(`py model/predict.py ${observed_brix} ${observed_pol} ${temp}`, async (err, stdout) => {
    if (err) return res.send("❌ Error in prediction");

    const result = stdout.trim().split(",");
    const record = {
      observed_brix,
      observed_pol,
      temp,
      corrected_brix: result[0],
      corrected_pol: result[1],
      normal_recovery: result[2],
      timestamp: new Date(),
      cane_id: req.body.cane_id || "N/A"
    };

    await collection.insertOne(record);
    const data = await collection.find().sort({ timestamp: -1 }).toArray();

    res.render("index", { prediction: "✅ Prediction saved!", data });
  });
});
app.get("/index", async (req, res) => {
    const data = await collection.find().sort({ timestamp: -1 }).toArray();
    res.render("index", { prediction: null, data });
});




// ----------------------
//  FETCH ROUTES
// ----------------------
app.get("/fetch", (req, res) => {
  if (!loggedInEmail) return res.redirect("/auth");
  res.render("fetch", { data: null });
});

app.post("/fetch", async (req, res) => {
  const { cane_id, date } = req.body;

  let query = {};
  if (cane_id) query.cane_id = cane_id;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    query.timestamp = { $gte: start, $lt: end };
  }

  const data = await collection.find(query).sort({ timestamp: -1 }).toArray();
  res.render("fetch", { data });
});


// ----------------------
// ANALYZE ROUTES
// ----------------------
app.get("/analyze", (req, res) => {
  if (!loggedInEmail) return res.redirect("/auth");
  res.render("analyze", { data: null });
});

app.post("/analyze", async (req, res) => {
  const { date } = req.body;

  if (!date) return res.send("❌ Please select a date");

  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  const data = await collection
    .find({ timestamp: { $gte: start, $lt: end } })
    .sort({ timestamp: 1 })
    .toArray();

  res.render("analyze", { data });
});


// ----------------------
// USER ACCOUNT DB
// ----------------------



// ----------------------
// EMAIL SENDER
// ----------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sucrosense@gmail.com",
    pass: "gxaayhjpoxykduxj"
  }
});

// ----------------------
// LOGIN SESSION
// ----------------------
let loggedInEmail = null;


// ----------------------
// ROOT → AUTH PAGE
// ----------------------
app.get("/", (req, res) => res.redirect("/auth"));



// ----------------------
// MERGED AUTH PAGE
// ----------------------
app.get("/auth", (req, res) => {
  res.render("auth", { message: "", mode: "login" });
});


// ----------------------
// SIGNUP
// ----------------------
app.post("/signup", async (req, res) => {
  const email = req.body.email.toLowerCase();
  const password = req.body.password;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render("auth", {
      message: "User already exists! Please log in.",
      mode: "login"
    });
  }

  const hashed = await bcrypt.hash(password, 10);
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiry = Date.now() + 2 * 60 * 1000;

  const user = new User({
    email,
    password: hashed,
    otp,
    otpExpires: expiry,
    verified: false
  });

  await user.save();

  await transporter.sendMail({
    to: email,
    subject: "Verify Your Email",
    text: `Your OTP is ${otp}. It expires in 2 minutes.`
  });

  const timer = Math.max(0, Math.floor((expiry - Date.now()) / 1000));

  res.render("verify", { email, message: "", timer });
});


// ----------------------
// RESEND OTP
// ----------------------
app.post("/resend", async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await User.findOne({ email });

  if (!user) return res.send("User not found");

  const newOtp = Math.floor(100000 + Math.random() * 900000);
  user.otp = newOtp;
  user.otpExpires = Date.now() + 2 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
    to: email,
    subject: "New OTP",
    text: `Your new OTP is ${newOtp}.`
  });

  const timer = Math.max(0, Math.floor((user.otpExpires - Date.now()) / 1000));

  res.render("verify", { email, message: "New OTP sent!", timer });
});


// ----------------------
// VERIFY OTP
// ----------------------
app.post("/verify", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.render("verify", { email, message: "User not found", timer: 0 });
  }

  const remaining = Math.max(0, Math.floor((user.otpExpires - Date.now()) / 1000));
  if (remaining <= 0) {
    return res.render("verify", { email, message: "OTP expired! Resend.", timer: 0 });
  }

  if (parseInt(otp, 10) !== user.otp) {
    return res.render("verify", {
      email,
      message: "Invalid OTP!",
      timer: remaining
    });
  }

  user.verified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  res.render("auth", {
    message: "✅ Email verified! Please log in.",
    mode: "login"
  });
});


// ----------------------
// LOGIN → HOMEPAGE
// ----------------------
app.post("/login", async (req, res) => {
  try {
    console.log("LOGIN ROUTE HIT");

    const email = req.body.email?.toLowerCase();
    const password = req.body.password;

    console.log("EMAIL:", email);
    console.log("PASSWORD:", password);

    const user = await User.findOne({ email });
    console.log("USER FOUND:", user);

    if (!user) {
      console.log("USER NOT FOUND");
      return res.render("auth", { message: "User not found", mode: "login" });
    }

    if (!user.verified) {
      console.log("USER NOT VERIFIED");
      return res.render("verify", {
        email: user.email,
        message: "Please verify your email first",
        timer: Math.max(0, Math.floor((user.otpExpires - Date.now()) / 1000))
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    console.log("PASSWORD VALID:", valid);

    if (!valid) {
      console.log("INVALID PASSWORD");
      return res.render("auth", { message: "Wrong password", mode: "login" });
    }

    loggedInEmail = user.email;

    console.log("LOGIN SUCCESS → Redirecting to /homepage");
    return res.redirect("/homepage");

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.send("Internal Login Error");
  }
});


// ----------------------
// LOGOUT
// ----------------------
app.get("/logout", (req, res) => {
  loggedInEmail = null;
  res.redirect("/auth");
});


app.get("/homepage", (req, res) => {
  if (!loggedInEmail) return res.redirect("/auth");
  res.render("homepage");
});
