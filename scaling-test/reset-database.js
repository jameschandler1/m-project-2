const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "..", "backend", ".env");
dotenv.config({ path: envPath });

const db = require("../backend/db");

async function logTableContents(tableName, label, orderByClause = null) {
  const orderBy = orderByClause ? ` ORDER BY ${orderByClause}` : "";
  const [rows] = await db
    .promise()
    .query(`SELECT * FROM ${tableName}${orderBy}`);

  if (rows.length === 0) {
    console.log(`${label} table is empty after reset.`);
    return;
  }

  console.log(`Table contents for ${label} (${rows.length} rows):`);
  console.table(rows);
}

async function resetDatabase() {
  console.log("Connected to the configured database.");

  try {
    await db.promise().query("SET FOREIGN_KEY_CHECKS = 0");

    const [mediaResult] = await db.promise().query("TRUNCATE TABLE media");
    const [taskResult] = await db.promise().query("TRUNCATE TABLE tasks");
    const [userResult] = await db.promise().query("TRUNCATE TABLE user");

    await db.promise().query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(
      `Cleared media table: ${mediaResult.affectedRows} rows removed`,
    );
    console.log(`Cleared tasks table: ${taskResult.affectedRows} rows removed`);
    console.log(`Cleared user table: ${userResult.affectedRows} rows removed`);

    await logTableContents("media", "media");
    await logTableContents("tasks", "tasks");
    await logTableContents("user", "user", "id");

    console.log("Database reset complete.");
  } finally {
    await db.end();
  }
}

resetDatabase().catch((err) => {
  console.error("Database reset failed:", err);
  process.exit(1);
});
