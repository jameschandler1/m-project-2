/**
 * User Model
 * 
 * This module provides data access methods for user operations including
 * authentication, user creation, and user lookup. All passwords are securely
 * hashed using bcrypt before storage.
 */

const db = require("../db");
const bcrypt = require("bcrypt");

const User = {
  /**
   * Create a new user with email and password
   * 
   * @param {string} email - User's email address (must be unique)
   * @param {string} password - Plain text password to be hashed
   * @returns {number} The ID of the newly created user
   */
  async create(email, password) {
    // Hash the password with bcrypt using salt rounds of 10
    // This provides a good balance between security and performance
    const hashed = await bcrypt.hash(password, 10);
    
    // Insert the new user into the database
    // Parameter chain: email, hashed_password -> SQL INSERT -> result.insertId
    const [result] = await db
      .promise()
      .query("INSERT INTO user (email, hashed_password) VALUES (?, ?)", [
        email,
        hashed,
      ]);
    
    // Return the auto-generated ID of the new user
    return result.insertId;
  },

  /**
   * Find a user by their email address
   * 
   * @param {string} email - Email address to search for
   * @returns {Object|null} User object with id, email, and hashed_password, or null if not found
   */
  async findByEmail(email) {
    // Query the database for a user with the given email
    // Returns sensitive data (hashed_password) for authentication verification
    const [rows] = await db
      .promise()
      .query("SELECT id, email, hashed_password FROM user WHERE email = ?", [email]);
    
    // Return the first (and only) user found, or undefined if no user exists
    return rows[0];
  },

  /**
   * Find a user by their ID
   * 
   * @param {number} id - User ID to search for
   * @returns {Object|null} User object with id and email, or null if not found
   */
  async findById(id) {
    // Query the database for a user with the given ID
    // Excludes sensitive data like hashed_password for security
    const [rows] = await db
      .promise()
      .query("SELECT id, email FROM user WHERE id = ?", [id]);
    
    // Return the first (and only) user found, or undefined if no user exists
    return rows[0];
  },

  /**
   * Verify a plain text password against a stored hash
   * 
   * @param {Object} user - User object containing hashed_password
   * @param {string} password - Plain text password to verify
   * @returns {boolean} True if password matches, false otherwise
   */
  async verifyPassword(user, password) {
    // Compare the provided password with the stored hash
    // bcrypt handles the salt extraction and comparison securely
    return bcrypt.compare(password, user.hashed_password);
  },
};

module.exports = User;
