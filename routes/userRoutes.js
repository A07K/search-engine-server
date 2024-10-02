// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create a JWT token and add it to the user's tokens array
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    user.tokens.push(token);
    await user.save();

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
  }
});

// Logout user
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    console.log("Logout request received with token:", req.token); // Debugging line

    // Remove the current token from the user's tokens array
    req.user.tokens = req.user.tokens.filter((token) => token !== req.token);
    await req.user.save();

    console.log("Token removed from user's tokens array:", req.user.tokens); // Debugging line

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error); // Debugging line
    res.status(500).json({ error: "Error logging out" });
  }
});

module.exports = router;
