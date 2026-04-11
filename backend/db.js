const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST || undefined,
  socketPath: !process.env.DB_HOST ? "/tmp/mysql.sock" : undefined, // Homebrew default
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "JamesKun15!",
  database: process.env.DB_NAME || "taskapp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
