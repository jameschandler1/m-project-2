const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { performance } = require("node:perf_hooks");

const envPath = path.resolve(__dirname, "..", "backend", ".env");

if (!fs.existsSync(envPath)) {
  throw new Error(`Environment file not found: ${envPath}`);
}

dotenv.config({ path: envPath });

const db = require("../backend/db");

const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    `Missing required database environment variables: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}

async function fetchAllTasks() {
  console.log(
    `Fetching all rows from tasks in database ${process.env.DB_NAME}...`,
  );

  const start = performance.now();

  try {
    const [rows] = await db.promise().query("SELECT * FROM tasks");
    const durationMs = performance.now() - start;

    console.log(`Task fetch successful: ${rows.length} rows returned.`);
    console.log(`Fetch time: ${durationMs.toFixed(2)} ms.`);
  } catch (error) {
    const durationMs = performance.now() - start;

    console.error("Task fetch failed.");
    console.error(`Elapsed before failure: ${durationMs.toFixed(2)} ms.`);
    console.error(`Error code: ${error.code || "unknown"}`);
    console.error(`Message: ${error.message}`);

    if (error.code === "ER_NO_SUCH_TABLE") {
      console.error(
        "The tasks table is missing. Check the database schema before running this benchmark.",
      );
    }

    process.exit(1);
  } finally {
    await db.end();
  }
}

fetchAllTasks().catch((error) => {
  console.error("Unexpected benchmark failure:", error.message);
  process.exit(1);
});
