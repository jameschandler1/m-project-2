/**
 * Database Connection Pool Configuration
 *
 * This module creates and exports a MySQL connection pool using the mysql2 library.
 * The pool manages multiple database connections to improve performance and handle
 * concurrent requests efficiently.
 *
 * Environment Variables Required:
 * - DB_HOST: MySQL server hostname (optional, uses socket if not provided)
 * - DB_USER: MySQL username
 * - DB_PASSWORD: MySQL password
 * - DB_NAME: Database name to connect to
 */

const fs = require("fs");
const mysql = require("mysql2");

const dbHost = process.env.DB_HOST;
const configuredSocketPath = process.env.DB_SOCKET_PATH;
const fallbackSocketPath = fs.existsSync("/tmp/mysql.sock")
  ? "/tmp/mysql.sock"
  : undefined;
const socketPath =
  configuredSocketPath || (!dbHost ? fallbackSocketPath : undefined);

if (!dbHost && !configuredSocketPath && !fallbackSocketPath) {
  console.warn(
    "MySQL socket fallback skipped: DB_HOST is unset, no DB_SOCKET_PATH is configured, and /tmp/mysql.sock is unavailable.",
  );
}

/**
 * MySQL connection pool configuration
 *
 * Creates a pool with the following settings:
 * - Uses a configured socket path or the local default socket when available
 * - Falls back to TCP when DB_HOST is explicitly set or no socket exists
 * - Waits for available connections when pool is exhausted
 * - Limits concurrent connections to 10
 * - No limit on queued connection requests
 */
const pool = mysql.createPool({
  host: dbHost,
  socketPath,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // Wait for connection if pool is exhausted
  connectionLimit: 100, // Maximum concurrent connections
  queueLimit: 0, // Unlimited queue for connection requests
});

/**
 * Export the connection pool for use throughout the application
 * The pool automatically handles connection management, so consumers
 * don't need to worry about opening/closing connections
 */
module.exports = pool;
