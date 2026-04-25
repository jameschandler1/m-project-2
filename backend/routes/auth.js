/**
 * Authentication Routes
 * 
 * This module defines Express routes for user authentication including:
 * - User registration with email validation
 * - User login with credential verification
 * - User logout and session destruction
 * 
 * All routes use express-validator for input sanitization and validation
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const router = express.Router();

/**
 * Register a new user
 * 
 * POST /api/auth/register
 * 
 * Request body:
 * - email: Valid email address (will be normalized)
 * - password: Minimum 8 characters with at least one lowercase, one uppercase, and one digit
 * 
 * Response:
 * - 201: Success with user ID and email
 * - 400: Validation errors
 * - 409: Email already registered
 * - 500: Server error
 */
router.post(
  "/register",
  [
    // Validate email format and normalize (remove extra spaces, convert to lowercase)
    body("email").isEmail().normalizeEmail(),
    // Password must be at least 8 chars with mixed case and numbers
    body("password").isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  async (req, res) => {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract validated input from request body
    const { email, password } = req.body;
    
    try {
      // Check if email is already registered
      const exists = await User.findByEmail(email);
      if (exists)
        return res.status(409).json({ error: "Email already registered" });
      
      // Create new user and get their ID
      const userId = await User.create(email, password);
      
      // Automatically log in the new user by setting session
      req.session.userId = userId;
      
      // Return user information (excluding sensitive data)
      res.json({ id: userId, email });
    } catch (e) {
      console.error("Registration error:", e);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

/**
 * Authenticate and login a user
 * 
 * POST /api/auth/login
 * 
 * Request body:
 * - email: Valid email address (will be normalized)
 * - password: User's password (non-empty)
 * 
 * Response:
 * - 200: Success with user ID and email
 * - 400: Validation errors
 * - 401: Invalid credentials
 * - 500: Server error
 */
router.post(
  "/login",
  [
    // Validate email format and normalize
    body("email").isEmail().normalizeEmail(),
    // Password must not be empty
    body("password").notEmpty(),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract validated credentials
    const { email, password } = req.body;
    
    try {
      // Find user by email (includes hashed password for verification)
      const user = await User.findByEmail(email);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      
      // Verify the provided password against the stored hash
      const valid = await User.verifyPassword(user, password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });
      
      // Create session for authenticated user
      req.session.userId = user.id;
      
      // Return user information (excluding sensitive data)
      res.json({ id: user.id, email: user.email });
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

/**
 * Logout the current user
 * 
 * POST /api/auth/logout
 * 
 * Destroys the user's session and clears the session cookie
 * 
 * Response:
 * - 200: Success message
 */
router.post("/logout", (req, res) => {
  // Destroy the session on the server
  req.session.destroy(() => {
    // Clear the session cookie from the client
    res.clearCookie("sid");
    res.json({ message: "Logged out" });
  });
});

module.exports = router;
