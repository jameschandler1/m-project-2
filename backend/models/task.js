// Import the database connection pool to execute SQL queries
const db = require("../db");

const Task = {
  /**
   * Create a new task in the database
   * @param {number} user_id - The ID of the user who owns this task
   * @param {string} title - The task title
   * @param {string} description - The task description (optional)
   * @param {string} due_date - The due date in YYYY-MM-DD format
   * @param {string|null} category - The task category (optional, defaults to null)
   * @returns {number} The ID of the newly created task
   */
  async create(user_id, title, description, due_date, category = null) {
    // Execute SQL INSERT query to add a new task
    // The ? marks are placeholders that prevent SQL injection attacks
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO tasks (user_id, title, description, due_date, category, completed, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW())",
        [user_id, title, description, due_date, category],
      );
    // Return the ID of the newly inserted task
    return result.insertId;
  },

  /**
   * Get all tasks belonging to a specific user
   * @param {number} user_id - The ID of the user whose tasks we want to retrieve
   * @returns {Array} Array of task objects belonging to the user, sorted by due date
   */
  async findAllByUser(user_id) {
    // Execute SQL SELECT query to get all tasks for a specific user
    // ORDER BY due_date sorts tasks chronologically
    const [rows] = await db
      .promise()
      .query("SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date", [
        user_id,
      ]);
    // Return the array of tasks
    return rows;
  },

  /**
   * Find a specific task by its ID and user ID
   * @param {number} id - The ID of the task to find
   * @param {number} user_id - The ID of the user who should own this task
   * @returns {Object|null} The task object if found, null if not found
   */
  async findById(id, user_id) {
    // Execute SQL SELECT query to find a specific task
    // Using both id AND user_id ensures users can only access their own tasks
    const [rows] = await db
      .promise()
      .query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);
    // Return the first (and only) task found, or undefined if no task found
    return rows[0];
  },

  /**
   * Update an existing task with new field values
   * @param {number} id - The ID of the task to update
   * @param {number} user_id - The ID of the user who owns this task
   * @param {Object} fields - Object containing the fields to update (e.g., {title: "New Title", completed: true})
   * @returns {boolean} True if update was successful, false if no rows were affected
   */
  async update(id, user_id, fields) {
    // Extract field names and values from the fields object
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    
    // If no fields provided, nothing to update
    if (!keys.length) return false;
    
    // Create the SET clause for the SQL query (e.g., "title = ?, completed = ?")
    const setClause = keys.map((k) => `${k} = ?`).join(", ");
    
    // Add the task ID and user ID to the values array for the WHERE clause
    values.push(id, user_id);
    
    // Execute SQL UPDATE query to modify the task
    // The setClause dynamically sets which fields to update
    const [result] = await db
      .promise()
      .query(
        `UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        values,
      );
    
    // Return true if at least one row was affected (task was updated)
    return result.affectedRows > 0;
  },

  /**
   * Delete a task from the database
   * @param {number} id - The ID of the task to delete
   * @param {number} user_id - The ID of the user who owns this task
   * @returns {boolean} True if deletion was successful, false if no rows were affected
   */
  async delete(id, user_id) {
    // Execute SQL DELETE query to remove the task
    // Using both id AND user_id ensures users can only delete their own tasks
    const [result] = await db
      .promise()
      .query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);
    
    // Return true if at least one row was affected (task was deleted)
    return result.affectedRows > 0;
  },
};

module.exports = Task;
