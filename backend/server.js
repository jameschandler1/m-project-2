require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const MySQLStore = require("express-mysql-session")(session);
const db = require("./db");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://3.21.125.57:3000"],
    credentials: true,
  }),
);
app.use(express.json());

// Session store
const sessionStore = new MySQLStore({}, db.promise());
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
