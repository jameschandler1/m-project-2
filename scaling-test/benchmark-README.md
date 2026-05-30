# Scaling Test Dataset Generator

This directory contains a Node.js script that generates **10,000 realistic rows** for the `tasks` table in the configured MySQL database.

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

## Configuration

Database settings are read from the shared backend environment file. Keep the project-specific values in `backend/.env` and let the scripts load them.

---

## Run the Seeder

```bash
node generate-tasks.js
```

## Reset the Database

The reset utility reads database settings from the shared backend environment file and clears the seeded tables without requiring extra runtime credentials.

```bash
node reset-database.js
```

The script will:

- clear `media`
- clear `tasks`
- clear `user`
- print the resulting table contents so you can confirm they are empty

---

## Notes

### Important

The script assumes:

- the configured database already exists
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


# Benchmark Paginated Tasks

A lightweight Node.js benchmarking utility for measuring the performance of a paginated tasks API endpoint.

This script is useful for comparing:

* Direct database query performance
* Paginated API endpoint performance
* Different pagination sizes
* Different environments or servers
* Scaling behavior as dataset size increases

---

# Requirements

* Node.js 18+ (uses native `fetch`)
* A running backend server
* A valid authenticated session cookie

---

# File

```bash
benchmark-paginated-tasks.js
```

---

# Basic Usage

The only required argument is:

```bash
--SESSION_COOKIE
```

Example:

```bash
node benchmark-paginated-tasks.js \
  --SESSION_COOKIE="connect.sid=s%3Aabc123"
```

---

# Optional Arguments

| Argument           | Description              | Default                           |
| ------------------ | ------------------------ | --------------------------------- |
| `--SESSION_COOKIE` | Auth session cookie      | REQUIRED                          |
| `--PAGE`           | Page number to request   | `1`                               |
| `--LIMIT`          | Number of tasks per page | `50`                              |
| `--URL`            | API endpoint URL         | `http://localhost:4000/api/tasks` |

---

# Examples

## Default benchmark

```bash
node benchmark-paginated-tasks.js \
  --SESSION_COOKIE="connect.sid=s%3Aabc123"
```

Requests:

```http
GET /api/tasks?page=1&limit=50
```

---

## Benchmark larger pages

```bash
node benchmark-paginated-tasks.js \
  --SESSION_COOKIE="connect.sid=s%3Aabc123" \
  --LIMIT=500
```

Useful for testing:

* large payload performance
* JSON serialization overhead
* pagination scaling

---

## Benchmark different pages

```bash
node benchmark-paginated-tasks.js \
  --SESSION_COOKIE="connect.sid=s%3Aabc123" \
  --PAGE=10 \
  --LIMIT=100
```

Useful for checking:

* OFFSET query performance
* deep pagination slowdown
* indexing efficiency

---

## Benchmark different environments

```bash
node benchmark-paginated-tasks.js \
  --SESSION_COOKIE="connect.sid=s%3Aabc123" \
  --URL="http://localhost:5000/api/tasks"
```

Useful for comparing:

* local vs production
* development vs optimized builds
* different backend implementations

---

# Example Output

```text
====================================
Paginated Endpoint Benchmark
====================================
URL: http://localhost:4000/api/tasks
Page: 1
Limit: 50

Request successful.

Response time: 42.18 ms
Returned tasks: 50
Total tasks: 10000
Current page: 1
Total pages: 200

Benchmark completed.
```

---

# Performance Testing Ideas

## Compare page sizes

Test how response time changes as payload size increases:

```bash
--LIMIT=50
--LIMIT=100
--LIMIT=500
--LIMIT=1000
```

---

## Compare pagination depth

Deep OFFSET queries can become slow:

```bash
--PAGE=1
--PAGE=10
--PAGE=100
--PAGE=1000
```

---

## Compare environments

Benchmark:

* local development
* Docker containers
* VPS deployments
* cloud hosting
* optimized production builds

---

# Recommended Extensions

## 1. Multi-run averages

Run the benchmark several times and compute:

* average response time
* median response time
* fastest request
* slowest request

This helps eliminate noise from single-request timing.

---

## 2. Concurrent request testing

Add support for:

```bash
--CONCURRENT=10
```

to simulate multiple simultaneous users.

Useful for load testing.

---

## 3. Export results

Save benchmark data to:

* JSON
* CSV
* Markdown tables

for tracking performance changes over time.

---

## 4. Memory usage metrics

Measure:

```js
process.memoryUsage()
```

before and after requests.

Useful for detecting serialization or payload issues.

---

## 5. Database timing comparison

Pair this script with your direct SQL benchmark script to compare:

| Test            | Measures                  |
| --------------- | ------------------------- |
| Direct DB query | Raw MySQL speed           |
| API benchmark   | Real application overhead |

This gives a much clearer picture of backend bottlenecks.

---

# Notes

This benchmark measures the full API request lifecycle, including:

* routing
* middleware
* authentication/session handling
* database query execution
* JSON serialization
* HTTP response delivery

As a result, API timings will naturally be slower than direct database query benchmarks.

That difference is expected and useful for identifying application-layer overhead.

---

# Troubleshooting

## 401 Unauthorized

Your session cookie is invalid or expired.

Log in again and copy a fresh cookie.

---

## ECONNREFUSED

Your backend server is not running.

Start the server before benchmarking.

---

## Very Slow Deep Pages

Large page numbers often indicate inefficient OFFSET queries.

Consider switching to:

* cursor pagination
* keyset pagination
* indexed pagination strategies

for better scalability.

---

# License

Internal development/testing utility.
