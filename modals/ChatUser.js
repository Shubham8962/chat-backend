const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    required: true,
    default:
      "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    // if default true no req of email verify
    default: true,
    required: true,
  },
});

// apply the indexing
userSchema.index({ name: "text", email: "text" });

module.exports = mongoose.model("ChatUser", userSchema);
