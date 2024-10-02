// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log("Token received in middleware:", token); // Debugging line

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      (err, decoded) => {
        if (err) {
          // Check for token expiration
          if (err.name === "TokenExpiredError") {
            return res
              .status(401)
              .json({ error: "Token expired, please log in again" });
          } else {
            return res.status(401).json({ error: "Invalid token" });
          }
        }
        return decoded;
      }
    );

    // If no decoded data is present (due to token error), return early
    if (!decoded) return;

    // Find user and validate token
    const user = await User.findOne({ _id: decoded.userId });
    if (!user || !user.tokens.includes(token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Attach user and token to request
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(401).json({ error: "Please authenticate" });
  }
};
