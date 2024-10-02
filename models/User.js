// models/User.js

const mongoose = require("mongoose");

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    searchHistory: [
      {
        type: String,
        trim: true,
      },
    ],
    tokens: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

// Method to compare password for login validation
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require("bcrypt");
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the user model
module.exports = mongoose.model("User", userSchema);
