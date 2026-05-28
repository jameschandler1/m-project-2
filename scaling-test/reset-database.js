const path = require("path");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const db = require("../backend/db");

const envPath = path.resolve(__dirname, "..", "backend", ".env");
dotenv.config({ path: envPath });

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];

    if (typeof value === "undefined" || value.startsWith("--")) {
      continue;
    }

    args[key] = value;
    index += 1;
  }

  return args;
}

const cliArgs = parseArgs(process.argv.slice(2));
const resetUserEmail = cliArgs.email;
const resetUserPassword = cliArgs.password;

if (!resetUserEmail) {
  throw new Error("Missing required --email argument.");
}

if (!resetUserPassword) {
  throw new Error("Missing required --password argument.");
}

async function resetDatabase() {
  console.log("Connected to the configured database.");
  console.log(`Reset target user: ${resetUserEmail}`);

  try {
    await db.promise().query("SET FOREIGN_KEY_CHECKS = 0");

    const [mediaResult] = await db.promise().query("TRUNCATE TABLE media");
    const [taskResult] = await db.promise().query("TRUNCATE TABLE tasks");
    const [userResult] = await db.promise().query("TRUNCATE TABLE user");

    await db.promise().query("SET FOREIGN_KEY_CHECKS = 1");

    const hashedPassword = await bcrypt.hash(resetUserPassword, 10);
    const [insertResult] = await db
      .promise()
      .query("INSERT INTO user (email, hashed_password) VALUES (?, ?)", [
        resetUserEmail,
        hashedPassword,
      ]);

    const [[userCountRow]] = await db
      .promise()
      .query("SELECT COUNT(*) AS userCount FROM user");

    console.log(
      `Cleared media table: ${mediaResult.affectedRows} rows removed`,
    );
    console.log(`Cleared tasks table: ${taskResult.affectedRows} rows removed`);
    console.log(`Cleared user table: ${userResult.affectedRows} rows removed`);
    console.log(
      `Created reset user id ${insertResult.insertId} for ${resetUserEmail}`,
    );
    console.log(`Remaining users after reset: ${userCountRow.userCount}`);
    console.log("Database reset complete.");
  } finally {
    await db.end();
  }
}

resetDatabase().catch((err) => {
  console.error("Database reset failed:", err);
  process.exit(1);
});
