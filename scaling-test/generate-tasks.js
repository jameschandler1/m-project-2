/**
 * Realistic Task Seeder for taskapp.tasks
 *
 * Generates 10,000 realistic task rows with:
 * - believable titles and descriptions
 * - mixed completion states
 * - varied due dates
 * - realistic categories
 * - timestamps spread across time
 *
 * Usage:
 *   node generate-tasks.js
 *
 * Requirements:
 *   npm install mysql2 faker
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { faker } = require("@faker-js/faker");

const envPath = path.resolve(__dirname, "..", "backend", ".env");

if (!fs.existsSync(envPath)) {
  throw new Error(`Environment file not found: ${envPath}`);
}

function loadEnvFile(filePath) {
  const envContent = fs.readFileSync(filePath, "utf8");

  envContent.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (typeof process.env[key] === "undefined") {
      process.env[key] = value;
    }
  });
}

loadEnvFile(envPath);

// ---------------- CONFIG ----------------
const TOTAL_ROWS = 10000;
const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingEnv.join(", ")}`,
  );
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};
// ----------------------------------------

const categories = [
  "Work",
  "Personal",
  "Health",
  "Finance",
  "School",
  "Home",
  "Shopping",
  "Fitness",
  "Travel",
  "Maintenance",
  "Creative",
  "Admin",
  null,
];

const taskPrefixes = [
  "Review",
  "Update",
  "Prepare",
  "Schedule",
  "Organize",
  "Research",
  "Draft",
  "Fix",
  "Refactor",
  "Plan",
  "Submit",
  "Complete",
  "Call",
  "Email",
  "Meet",
  "Finalize",
  "Audit",
  "Clean",
  "Backup",
  "Deploy",
];

const taskObjects = [
  "quarterly budget",
  "team presentation",
  "client onboarding",
  "API integration",
  "doctor appointment",
  "marketing assets",
  "weekly grocery list",
  "database migration",
  "tax documents",
  "security audit",
  "project roadmap",
  "design revisions",
  "performance report",
  "inventory spreadsheet",
  "travel itinerary",
  "code review",
  "feature rollout",
  "user feedback analysis",
  "podcast outline",
  "studio session",
];

function randomDate(startDaysAgo = 180, futureDays = 120) {
  const start = new Date();
  start.setDate(start.getDate() - startDaysAgo);

  const end = new Date();
  end.setDate(end.getDate() + futureDays);

  return faker.date.between({ from: start, to: end });
}

function createTask() {
  const prefix = faker.helpers.arrayElement(taskPrefixes);
  const object = faker.helpers.arrayElement(taskObjects);

  const title = `${prefix} ${object}`;

  const description = faker.helpers.arrayElement([
    faker.lorem.sentences({ min: 1, max: 3 }),
    `Need to follow up with ${faker.person.firstName()} about ${object}.`,
    `Priority task for ${faker.company.name()} collaboration.`,
    `Blocked pending review from ${faker.person.fullName()}.`,
    `Remember to attach updated files before completion.`,
    `Coordinate timeline with the ${faker.commerce.department()} team.`,
  ]);

  const dueDate = faker.date.soon({ days: 120 });

  const completed = faker.datatype.boolean(0.38) ? 1 : 0;

  const updatedAt = randomDate();

  // assumes users already exist in DB
  const userId = faker.number.int({ min: 1, max: 250 });

  return [
    userId,
    title,
    description,
    dueDate.toISOString().split("T")[0],
    faker.helpers.arrayElement(categories),
    completed,
    updatedAt,
  ];
}

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  console.log("Connected to MySQL.");

  const batchSize = 1000;

  for (let i = 0; i < TOTAL_ROWS; i += batchSize) {
    const batch = [];

    for (let j = 0; j < batchSize; j++) {
      batch.push(createTask());
    }

    const query = `
      INSERT INTO tasks
      (user_id, title, description, due_date, category, completed, updated_at)
      VALUES ?
    `;

    await connection.query(query, [batch]);

    console.log(`Inserted ${i + batch.length} / ${TOTAL_ROWS} rows`);
  }

  await connection.end();

  console.log("Done seeding realistic task data.");
}

main().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
