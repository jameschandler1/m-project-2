/**
 * Express Server Configuration
 * 
 * This is the main entry point for the Task Tracking API server.
 * It configures middleware, session management, CORS, and routes.
 * 
 * Environment Variables Required:
 * - SESSION_SECRET: Secret key for session encryption
 * - PORT: Server port (defaults to 4000)
 * - CORS_ORIGINS: Comma-separated list of allowed origins
 * - DB_*: Database connection variables (see db.js)
 */

// Load environment variables from .env file
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const MySQLStore = require("express-mysql-session")(session);

const db = require("./db");
const app = express();

/**
 * CORS Configuration
 * 
 * Configures Cross-Origin Resource Sharing to allow frontend applications
 * to access the API. Uses environment variable for flexibility.
 */
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000','http://localhost:3001','http://3.19.209.11:3000','http://3.19.209.11:3001'];

// Apply CORS middleware with credentials support
// credentials: true allows cookies to be sent with cross-origin requests
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

// Parse JSON request bodies
// This middleware parses incoming JSON payloads and makes them available in req.body
app.use(express.json());

/**
 * Session Configuration
 * 
 * Configures session management using MySQL as the session store.
 * Sessions persist across server restarts and can be shared by multiple instances.
 */

// Create MySQL-based session store
// Parameter chain: {} (options) -> db.promise() -> MySQLStore instance
// This stores session data in the database for persistence and scalability
const sessionStore = new MySQLStore({}, db.promise());

// Validate required environment variable
if (!process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET environment variable is required');
  process.exit(1);
}

// Configure session middleware
app.use(
  session({
    key: "sid", // Cookie name for the session ID
    secret: process.env.SESSION_SECRET, // Secret for signing session cookies
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    store: sessionStore, // Use MySQL store instead of default memory store
    cookie: {
      httpOnly: true, // Prevent client-side JavaScript access
      secure: false, // Set to false for HTTP/development (true for HTTPS)
      sameSite: "strict", // Strict CSRF protection
      maxAge: 1000 * 60 * 60 * 24, // 1 day expiration
    },
  }),
);

/**
 * API Routes
 * 
 * Mount route handlers for different API endpoints.
 * Each route module handles its own authentication and validation.
 */

// Authentication routes: /api/auth/*
app.use("/api/auth", require("./routes/auth"));

// Task management routes: /api/tasks/*
// These routes are protected by authentication middleware within the module
app.use("/api/tasks", require("./routes/tasks"));

/**
 * Health Check Endpoint
 * 
 * GET /
 * 
 * Simple endpoint to verify the server is running.
 * Useful for load balancers and monitoring tools.
 */
app.get("/", (req, res) => res.send("API running"));

/**
 * Server Startup
 * 
 * Starts the Express server on the configured port.
 * Uses environment variable PORT or defaults to 4000.
 */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
