const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { search } = require("../controllers/searchController");

// Add search to history - Requires Authentication
router.post("/history", authMiddleware, async (req, res) => {
  try {
    const { searchTerm } = req.body;
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const user = req.user; // User is now available from authMiddleware
    user.searchHistory.push(searchTerm);
    await user.save();

    res.status(200).json({ message: "Search added to history", searchTerm });
  } catch (error) {
    console.error("Error adding search to history:", error);
    res.status(500).json({ error: "Error adding search to history" });
  }
});

// Get user's search history - Requires Authentication
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const user = req.user; // User is now available from authMiddleware
    res.json(user.searchHistory);
  } catch (error) {
    console.error("Error fetching search history:", error);
    res.status(500).json({ error: "Error fetching search history" });
  }
});

// Search route - No Authentication Required
router.post("/search", async (req, res) => {
  try {
    await search(req, res); // Perform search without requiring authentication
  } catch (error) {
    console.error("Error in search route:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

module.exports = router;
