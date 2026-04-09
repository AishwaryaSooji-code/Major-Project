const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: Number,
  otpExpires: Date,
  verified: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", userSchema);
