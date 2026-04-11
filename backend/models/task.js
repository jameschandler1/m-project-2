const db = require("../db");

const Task = {
  async create(user_id, title, description, due_date, category) {
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO tasks (user_id, title, description, due_date, category, completed, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW())",
        [user_id, title, description, due_date, category],
      );
    return result.insertId;
  },
  async findAllByUser(user_id) {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date", [
        user_id,
      ]);
    return rows;
  },
  async findById(id, user_id) {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);
    return rows[0];
  },
  async update(id, user_id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    if (!keys.length) return false;
    const setClause = keys.map((k) => `${k} = ?`).join(", ");
    values.push(id, user_id);
    const [result] = await db
      .promise()
      .query(
        `UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        values,
      );
    return result.affectedRows > 0;
  },
  async delete(id, user_id) {
    const [result] = await db
      .promise()
      .query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);
    return result.affectedRows > 0;
  },
};

module.exports = Task;
