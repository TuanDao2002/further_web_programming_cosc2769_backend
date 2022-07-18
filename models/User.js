const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    enum: {
      values: ["Male", "Female", "Other"],
      message: "{VALUE} is not a supported category", // Error message
    },
    required: true,
  },
  location: {
    type: String,
    required: true,
    enum: {
      values: ["HCM City", "Hanoi", "Danang"],
      message: "{VALUE} is not a supported location", // Error message
    },
  },
  hobbies: {
    type: [String],
    required: true,
  },
  biography: {
    type: String,
    maxLength: 100,
    required: true,
  },
  major: {
    type: String,
    required: true,
    enum: {
      values: ["SSET", "SBM", "SCD"],
      message: "{VALUE} is not a supported major", // Error message
    },
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('User', userSchema);
