# Scaling Test Dataset Generator

This directory contains a Node.js script that generates **10,000 realistic rows** for the `tasks` table in the `taskapp` MySQL database.

The generated data is designed to look believable and useful for:
- scaling tests
- pagination testing
- search/filter testing
- analytics testing
- performance benchmarking

The task data includes:
- realistic titles
- varied descriptions
- multiple categories
- mixed completion states
- randomized due dates
- randomized timestamps
- multiple user IDs

The schema was based on the uploaded task model:
- `tasks.user_id`
- `tasks.title`
- `tasks.description`
- `tasks.due_date`
- `tasks.category`
- `tasks.completed`
- `tasks.updated_at`

Referenced model files:
- task.js
- user.js
- media.js

---

## Requirements

Install dependencies:

```bash
npm install mysql2 @faker-js/faker
```

---

## Environment Variables

The script supports environment variables for database credentials.

### macOS / Linux

```bash
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_NAME=taskapp
```

### Windows (PowerShell)

```powershell
$env:DB_HOST="localhost"
$env:DB_USER="root"
$env:DB_PASSWORD="yourpassword"
$env:DB_NAME="taskapp"
```

---

## Run the Seeder

```bash
node generate-tasks.js
```

---

## Notes

### Important
The script assumes:
- the `taskapp` database already exists
- the `tasks` table already exists
- user IDs already exist in the `user` table

The generator randomly assigns task ownership to users with IDs between 1 and 250.

If your database contains fewer users, modify this line in the script:

```js
const userId = faker.number.int({ min: 1, max: 250 });
```

---

## Example Generated Task

```json
{
  "user_id": 42,
  "title": "Review quarterly budget",
  "description": "Need to follow up with Samantha about quarterly budget.",
  "due_date": "2026-07-14",
  "category": "Finance",
  "completed": 0
}
```

---

## Performance Tips

For faster inserts:
- temporarily disable indexes during large imports
- increase MySQL packet size if necessary
- use SSD-backed storage
- run locally rather than over remote DB connections

---

## Files

- `generate-tasks.js` → main seeding script
- `README.md` → setup and usage instructions
