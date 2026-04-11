const express = require("express");
const User = require("../models/user");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const exists = await User.findByEmail(email);
    if (exists)
      return res.status(409).json({ error: "Email already registered" });
    const userId = await User.create(email, password);
    req.session.userId = userId;
    res.json({ id: userId, email });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await User.verifyPassword(user, password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email });
  } catch (e) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ message: "Logged out" });
  });
});

module.exports = router;
