const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");

const envPath = path.resolve(
__dirname,
"..",
"backend",
".env"
);

if (!fs.existsSync(envPath)) {
throw new Error(
`Environment file not found: ${envPath}`
);
}

dotenv.config({ path: envPath });

const db = require("../backend/db");

// ============================================
// Configuration
// ============================================

const USER_COUNT = 100;
const TASKS_PER_USER = 100;

const PASSWORD = "Password123";

// ============================================
// Task Data
// ============================================

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
"Verify pending tasks and communicate blockers.",
"Prepare final file for approval.",
];

// ============================================
// Main
// ============================================

async function seedUsers() {
console.log(
`Creating ${USER_COUNT} load-test users...`
);

const hashedPassword =
await bcrypt.hash(PASSWORD, 10);

const userIds = [];

for (let i = 1; i <= USER_COUNT; i++) {
const email =
`loadtest-user-${i}@example.com`;

try {
  const [existing] = await db
    .promise()
    .query(
      "SELECT id FROM user WHERE email = ?",
      [email]
    );

  if (existing.length > 0) {
    userIds.push(existing[0].id);

    console.log(
      `[EXISTS] ${email}`
    );

    continue;
  }

  const [result] = await db
    .promise()
    .query(
      `
      INSERT INTO user
      (email, hashed_password)
      VALUES (?, ?)
    `,
      [email, hashedPassword]
    );

  userIds.push(result.insertId);

  console.log(
    `[CREATED] ${email}`
  );
} catch (err) {
  console.error(
    `Failed creating ${email}`
  );

  console.error(err.message);
}


}

console.log(
`Creating tasks for ${userIds.length} users...`
);

const taskRows = [];

for (const userId of userIds) {
for (
let taskIndex = 0;
taskIndex < TASKS_PER_USER;
taskIndex++
) {
const dueDate = new Date();


  dueDate.setDate(
    dueDate.getDate() +
      (taskIndex % 30)
  );

  taskRows.push([
    userId,
    `${taskTitles[
      taskIndex %
        taskTitles.length
    ]} ${taskIndex + 1}`,
    taskDescriptions[
      taskIndex %
        taskDescriptions.length
    ],
    dueDate
      .toISOString()
      .split("T")[0],
    "Load Test",
    0,
  ]);
}


}

console.log(
`Inserting ${taskRows.length} tasks...`
);

await db.promise().query(
`       INSERT INTO tasks
      (
        user_id,
        title,
        description,
        due_date,
        category,
        completed
      )
      VALUES ?
    `,
[taskRows]
);

console.log("");
console.log(
"Load test data created successfully."
);
console.log(
`Users: ${userIds.length}`
);
console.log(
`Tasks: ${taskRows.length}`
);
}

seedUsers()
.catch((err) => {
console.error(err);
process.exit(1);
})
.finally(async () => {
await db.end();
});
