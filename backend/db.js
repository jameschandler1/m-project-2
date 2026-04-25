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

const mysql = require("mysql2");

/**
 * MySQL connection pool configuration
 * 
 * Creates a pool with the following settings:
 * - Uses socket path for local development when DB_HOST is not set
 * - Waits for available connections when pool is exhausted
 * - Limits concurrent connections to 10
 * - No limit on queued connection requests
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  // Use Unix socket for local MySQL installations (Homebrew default)
  // Falls back to TCP connection when DB_HOST is explicitly set
  socketPath: !process.env.DB_HOST ? "/tmp/mysql.sock" : undefined,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // Wait for connection if pool is exhausted
  connectionLimit: 10, // Maximum number of concurrent connections
  queueLimit: 0, // Unlimited queue for connection requests
});

/**
 * Export the connection pool for use throughout the application
 * The pool automatically handles connection management, so consumers
 * don't need to worry about opening/closing connections
 */
module.exports = pool;
