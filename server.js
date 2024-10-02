// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Default route for root URL
app.get("/", (req, res) => {
  res.send("Welcome to the Search Engine API");
});

// API routes
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/search", require("./routes/searchRoutes")); // Add this if you have search routes

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log("Server is running on port", PORT);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });

// Check for necessary environment variables
console.log("Environment variables loaded:");
console.log(
  "YOUTUBE_API_KEY:",
  process.env.YOUTUBE_API_KEY ? "Set" : "Not set"
);
console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "Set" : "Not set");
console.log(
  "GOOGLE_SEARCH_ENGINE_ID:",
  process.env.GOOGLE_SEARCH_ENGINE_ID ? "Set" : "Not set"
);
console.log(
  "GOOGLE_SCHOLAR_API:",
  process.env.GOOGLE_SCHOLAR_API ? "Set" : "Not set"
);
