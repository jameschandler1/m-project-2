/**
 * Authentication Middleware
 *
 * This middleware protects routes by verifying JWT tokens.
 * It checks for a valid JWT token in the Authorization header or cookie,
 * validates the token, and attaches user information to the request object.
 *
 * Usage: Apply this middleware to any route that requires authentication
 * Example: router.use(authMiddleware);
 */

const { authenticateToken } = require("./jwt");

module.exports = authenticateToken;
