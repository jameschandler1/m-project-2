const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "..", "backend", ".env");

if (!fs.existsSync(envPath)) {
  throw new Error(`Environment file not found: ${envPath}`);
}

dotenv.config({ path: envPath });

const db = require("../backend/db");

const TOTAL_ROWS = 10000;
const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    `Missing required database environment variables: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}

const taskTitles = [
  "Prepare quarterly review",
  "Update project plan",
  "Review client feedback",
  "Schedule team sync",
  "Complete budget draft",
  "Organize research notes",
  "Draft release notes",
  "Check integration status",
  "Plan sprint backlog",
  "Confirm travel details",
];

const taskDescriptions = [
  "Review the current status and summarize next steps.",
  "Update the shared document before the stakeholder meeting.",
  "Collect feedback from the team and prepare a response.",
  "Verify pending tasks and communicate any blockers.",
  "Prepare the final file for review and approval.",
  "Check milestones and update the timeline.",
  "Document the progress and note outstanding follow-ups.",
  "Coordinate with the responsible owners before the deadline.",
  "Validate the changes and capture the final status.",
  "Archive the completed notes and share the summary.",
];

const categories = ["Work", "Personal", "Health", "Finance", "School", "Home"];

async function generateTasks() {
  console.log(
    `Starting insertion of ${TOTAL_ROWS} tasks into database ${process.env.DB_NAME}...`,
  );

  try {
    const [userRows] = await db
      .promise()
      .query("SELECT id FROM user ORDER BY id");

    if (userRows.length === 0) {
      console.error(
        "No user records found in the user table. Create at least one user before generating tasks.",
      );
      process.exit(1);
    }

    const userIds = userRows.map((row) => row.id);
    const taskRows = [];

    for (let index = 0; index < TOTAL_ROWS; index += 1) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const title = `${taskTitles[index % taskTitles.length]} ${index + 1}`;
      const description = taskDescriptions[index % taskDescriptions.length];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (index % 30) + 1);
      const category = categories[index % categories.length];
      const completed = index % 5 === 0 ? 1 : 0;

      taskRows.push([
        userId,
        title,
        description,
        dueDate.toISOString().split("T")[0],
        category,
        completed,
      ]);
    }

    const start = Date.now();
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO tasks (user_id, title, description, due_date, category, completed) VALUES ?",
        [taskRows],
      );

    const elapsedMs = Date.now() - start;

    console.log(
      `Task insertion successful: ${result.affectedRows} rows inserted into tasks.`,
    );
    console.log(`Insertion took ${elapsedMs} ms.`);
  } catch (error) {
    console.error("Task insertion failed.");
    console.error(`Error code: ${error.code || "unknown"}`);
    console.error(`Message: ${error.message}`);

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      console.error(
        "This usually means the selected user_id values do not exist in the user table. Ensure users exist before running this script.",
      );
    }

    if (error.code === "ER_NO_SUCH_TABLE") {
      console.error(
        "The tasks table is missing. Check the database schema and run the migrations before inserting data.",
      );
    }

    process.exit(1);
  } finally {
    await db.end();
  }
}

generateTasks().catch((error) => {
  console.error("Unexpected generator failure:", error.message);
  process.exit(1);
});
