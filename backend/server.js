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
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});
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
  : ['http://localhost:3000','http://localhost:3001','https://18.188.203.200:3000','https://18.188.203.200:3001'];

// Apply CORS middleware with credentials support
// credentials: true allows cookies to be sent with cross-origin requests
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

// Stripe webhook endpoint needs raw body parsing
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/payment")
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
  console.error('Please set SESSION_SECRET in your environment or .env file');
  process.exit(1);
}

// Configure session middleware
app.use(
  session({
    key: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: false, // change to true only when HTTPS is enabled
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    },
  })
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

// Media upload routes: /api/upload/*
// These routes handle file uploads and media management
app.use("/api/upload", require("./routes/upload"));

// Payment routes: /api/payment/*
// These routes handle Stripe payment integration
app.use("/api/payment", require("./routes/payment"));

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
