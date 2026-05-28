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
const { performance } = require("node:perf_hooks");
const mysql = require("mysql2/promise");

let faker;

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

const API_BASE_URL =
  process.env.API_BASE_URL || `http://localhost:${process.env.PORT}`;
const API_FETCH_REQUESTS = Number.parseInt(
  process.env.API_FETCH_REQUESTS || "1",
  10,
);
const API_SESSION_COOKIE = process.env.API_SESSION_COOKIE || "";
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

async function loadFaker() {
  if (faker) {
    return faker;
  }

  const fakerModule = await import("@faker-js/faker");
  faker = fakerModule.faker;
  return faker;
}

function randomDate(startDaysAgo = 180, futureDays = 120) {
  const start = new Date();
  start.setDate(start.getDate() - startDaysAgo);

  const end = new Date();
  end.setDate(end.getDate() + futureDays);

  return faker.date.between({ from: start, to: end });
}

const existingUserIds = [];

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

  if (existingUserIds.length === 0) {
    throw new Error(
      "No existing user IDs available to assign generated tasks.",
    );
  }

  const userId = faker.helpers.arrayElement(existingUserIds);

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

async function benchmarkTaskFetch() {
  if (!API_BASE_URL) {
    console.log(
      "API benchmark skipped because API_BASE_URL is not configured.",
    );
    return;
  }

  const fetchUrl = `${API_BASE_URL.replace(/\/$/, "")}/api/tasks`;
  const fetchHeaders = {};

  if (API_SESSION_COOKIE) {
    fetchHeaders.Cookie = API_SESSION_COOKIE;
  }

  const benchmarkRequests = Number.isFinite(API_FETCH_REQUESTS)
    ? Math.max(1, API_FETCH_REQUESTS)
    : 1;

  console.log(
    `Benchmarking ${benchmarkRequests} fetch(es) against ${fetchUrl}`,
  );

  const startTime = new Date();
  const benchmarkStart = performance.now();

  let totalDuration = 0;
  let totalTaskCount = 0;

  for (
    let requestIndex = 0;
    requestIndex < benchmarkRequests;
    requestIndex += 1
  ) {
    const requestStart = performance.now();

    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: fetchHeaders,
    });

    const requestElapsed = performance.now() - requestStart;
    totalDuration += requestElapsed;

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `API fetch benchmark failed with status ${response.status}: ${responseBody}`,
      );
    }

    const tasks = await response.json();
    totalTaskCount = tasks.length;

    console.log(
      `Fetch request ${requestIndex + 1}/${benchmarkRequests}: ${tasks.length} tasks returned in ${requestElapsed.toFixed(2)}ms`,
    );
  }

  const endTime = new Date();
  const elapsed = performance.now() - benchmarkStart;
  const average = elapsed / benchmarkRequests;

  console.log(`API fetch benchmark start time: ${startTime.toISOString()}`);
  console.log(`API fetch benchmark end time: ${endTime.toISOString()}`);
  console.log(`API fetch benchmark elapsed: ${elapsed.toFixed(2)}ms`);
  console.log(`Average time per fetch request: ${average.toFixed(2)}ms`);
  console.log(
    `API fetch benchmark summary: ${benchmarkRequests} request(s), ${totalTaskCount} tasks returned, ${totalDuration.toFixed(2)}ms total fetch time`,
  );
}

async function main() {
  await loadFaker();
  const connection = await mysql.createConnection(dbConfig);

  console.log("Connected to MySQL.");

  const [userRows] = await connection.query("SELECT id FROM user");
  existingUserIds.push(...userRows.map((row) => row.id));

  if (existingUserIds.length === 0) {
    throw new Error(
      "No users found in the user table. Seed at least one user before generating tasks.",
    );
  }

  console.log(`Loaded ${existingUserIds.length} user IDs for task generation.`);

  const batchSize = 1000;
  let insertedRows = 0;

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

    insertedRows += batch.length;
    console.log(
      `Batch inserted: ${batch.length} rows (total inserted: ${insertedRows}/${TOTAL_ROWS})`,
    );
  }

  await connection.end();

  console.log(`Seed complete: ${insertedRows} rows inserted into tasks.`);

  try {
    await benchmarkTaskFetch();
  } catch (error) {
    console.error("API fetch benchmark failed:", error.message);
  }

  console.log("Done seeding realistic task data.");
}

main().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
