const db = require("../db");
const bcrypt = require("bcrypt");

const User = {
  async create(email, password) {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db
      .promise()
      .query("INSERT INTO user (email, hashed_password) VALUES (?, ?)", [
        email,
        hashed,
      ]);
    return result.insertId;
  },
  async findByEmail(email) {
    const [rows] = await db
      .promise()
      .query("SELECT id, email, hashed_password FROM user WHERE email = ?", [email]);
    return rows[0];
  },
  async findById(id) {
    const [rows] = await db
      .promise()
      .query("SELECT id, email FROM user WHERE id = ?", [id]);
    return rows[0];
  },
  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.hashed_password);
  },
};

module.exports = User;
