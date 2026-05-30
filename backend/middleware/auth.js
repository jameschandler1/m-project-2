/**
 * Authentication Middleware
 * 
 * This middleware protects routes by verifying that a valid user session exists.
 * It checks for a userId in the session, validates that the user exists in the database,
 * and attaches user information to the request object for downstream handlers.
 * 
 * Usage: Apply this middleware to any route that requires authentication
 * Example: router.use(authMiddleware);
 */

const User = require("../models/user");

/**
 * Authentication middleware function
 *
 * @param {Object} req - Express request object containing session data
 * @param {Object} res - Express response object for sending responses
 * @param {Function} next - Express next function to pass control to next middleware
 * @returns {void} - Either calls next() for valid auth or sends error response
 */
module.exports = async function (req, res, next) {
  // Step 1: Check if user ID exists in session
  // This is the first line of defense - no session means no access
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Step 2: Check if user data is already cached in session
  // This avoids unnecessary database queries on every request
  if (req.session.user) {
    req.user = req.session.user;
    return next();
  }

  try {
    // Step 3: Validate that the user from session still exists in database
    // This handles cases where user was deleted but session is still valid
    const user = await User.findById(req.session.userId);

    if (!user) {
      // User no longer exists, invalidate the session completely
      req.session.destroy();
      return res.status(401).json({ error: "User not found" });
    }

    // Step 4: Cache sanitized user data in session for subsequent requests
    // Only include necessary fields (id, email) - never include sensitive data
    req.session.user = { id: user.id, email: user.email };
    req.user = req.session.user;

    // Step 5: Pass control to the next middleware/route handler
    // Authentication successful, proceed with the request
    next();
  } catch (error) {
    // Handle database errors or other unexpected failures
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};
