require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const MySQLStore = require("express-mysql-session")(session);

const db = require("./db");
const app = express();

// CORS configuration with environment variable support
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000','http://localhost:3001','http://3.19.209.11:3000','http://3.19.209.11:3001'];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());

// Session store
const sessionStore = new MySQLStore({}, db.promise());

// Check if session secret is available
if (!process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET environment variable is required');
  process.exit(1);
}

app.use(
  session({
    key: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for HTTP/development
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);

// Routes will be added here

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));

app.get("/", (req, res) => res.send("API running"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
