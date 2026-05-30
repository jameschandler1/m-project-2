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

// Try to use Redis for session storage if available, fall back to MySQL
let sessionStore;
try {
  const RedisStore = require("connect-redis")(session);
  const redis = require("redis");
  const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  });

  redisClient.on('error', (err) => {
    console.log('Redis client error, falling back to MySQL:', err.message);
  });

  sessionStore = new RedisStore({ client: redisClient });
  console.log("✓ Using Redis for session storage");
  console.log(`  Redis host: ${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`);
} catch (e) {
  console.log("✗ Redis not available, falling back to MySQL session storage");
  console.log("  Error:", e.message);
  console.log("  To enable Redis: Ensure redis is installed and running");
  console.log("  Then set REDIS_HOST and REDIS_PORT environment variables");
  sessionStore = new MySQLStore({}, db.promise());
  console.log("✓ Using MySQL for session storage");
}

/**
 * CORS Configuration
 *
 * Configures Cross-Origin Resource Sharing to allow frontend applications
 * to access the API. Uses environment variable for flexibility.
 */
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000','http://localhost:3001','https://18.119.176.95:3000','https://18.119.176.95:3001'];

// Apply CORS middleware with credentials support
// credentials: true allows cookies to be sent with cross-origin requests
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

// Stripe webhook endpoint needs raw body parsing
// Only attach the raw body parser here.
// Do NOT mount the payment router here.
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
);

// Parse JSON request bodies
// This middleware parses incoming JSON payloads and makes them available in req.body
app.use(express.json());

/**
 * Session Configuration
 *
 * Configures session management using Redis (if available) or MySQL as fallback.
 * Sessions persist across server restarts and can be shared by multiple instances.
 */

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
    rolling: false, // Disable rolling sessions to reduce database writes
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
