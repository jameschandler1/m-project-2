# Scaling Test Suite

This directory contains scripts used to load test the Task Tracking application.

The goal of these tests is to measure:

* Homepage performance under concurrent load
* Authenticated API performance under concurrent load
* Database read performance under concurrent load

---

# Prerequisites

## Install Dependencies

Install k6:

### macOS

```bash
brew install k6
```

### Windows

```powershell
choco install k6
```

### Linux

```bash
# See the official k6 installation guide
# https://k6.io/docs/getting-started/installation/
```

## Backend Dependencies

The seed script requires Node.js and the backend dependencies:

```bash
cd backend
npm install
```

---

# Verify Backend Is Running

For local testing:

```bash
cd backend
npm start
```

The backend runs on port 4000 by default.

For deployed testing:

```text
http://<server-ip>:4000
```

---

# Directory Contents

```text
scaling-test/
├── load-README.md           # This file
├── seed-loadtest-users.js   # Generates test users and tasks
├── load-test.js             # Homepage load test (no auth)
└── ramp-load-test.js        # Authenticated API ramp test
```

---

# Execution Order

**IMPORTANT**: Run the scripts in this order for proper testing:

1. **seed-loadtest-users.js** - Generate test data (run once)
2. **load-test.js** - Test homepage performance
3. **ramp-load-test.js** - Test authenticated API performance

---

# Step 1: Create Load Test Data

The authenticated load test requires users with task data.

The seed script creates:

* 100 users
* 100 tasks per user
* 10,000 total tasks

Test users follow this pattern:

```text
loadtest-user-1@example.com
loadtest-user-2@example.com
...
loadtest-user-100@example.com
```

Password for all test users:

```text
Password123
```

## Run the Seed Script

From the project root:

```bash
node scaling-test/seed-loadtest-users.js
```

Expected result:

```text
Creating 100 load-test users...
[CREATED] loadtest-user-1@example.com
...
Creating tasks for 100 users...
Inserting 10000 tasks...
Load test data created successfully.
Users: 100
Tasks: 10000
```

**Note**: This only needs to be run once unless the database is reset.

---

# Step 2: Homepage Load Test

Purpose:

Simulate 50 concurrent users hitting the homepage for 30 seconds.

Endpoint:

```text
GET /
```

Configuration:

* 50 virtual users
* 30 second duration
* No authentication required

## Run the Test

```bash
cd scaling-test
k6 run load-test.js
```

Or with a custom URL:

```bash
URL=http://your-server:4000 k6 run load-test.js
```

Expected behavior:

* No authentication required
* Exercises Express routing
* Exercises network stack
* Minimal database activity

---

# Step 3: Authenticated API Ramp Test

Purpose:

Test authenticated API performance with session-based authentication.

Gradually ramps from 0 to 100 concurrent users, sustains at 100 for 1 minute, then ramps down.

Endpoint:

```text
POST /api/auth/login
GET /api/tasks?page=1&limit=50
```

Configuration:

* Stage 1: 30s ramp to 100 VUs
* Stage 2: 1m sustain at 100 VUs
* Stage 3: 30s ramp to 0 VUs
* Total duration: 2 minutes

## Run the Test

```bash
cd scaling-test
k6 run ramp-load-test.js
```

Or with a custom URL:

```bash
URL=http://your-server:4000 k6 run ramp-load-test.js
```

Expected behavior:

Each virtual user:

1. Selects a random pre-generated test user
2. Authenticates via POST to `/api/auth/login`
3. Extracts session cookie from login response
4. Makes authenticated GET request to `/api/tasks`
5. Repeats for each iteration

This test exercises:

* Session-based authentication
* Session cookie handling
* MySQL session storage
* Authentication middleware
* Task count queries
* Paginated task queries
* JSON serialization

---

# Interpreting Results

Example:

```text
http_reqs................: 14523

http_req_duration........:
avg=42ms

http_req_duration........:
p(95)=110ms

http_req_failed..........:
0.00%
```

## Requests Per Second

Calculate:

```text
requests/sec =
total requests / test duration
```

Example:

```text
14523 / 30

≈ 484 requests/sec
```

---

## Average Response Time

```text
avg
```

Average request latency.

Example:

```text
avg = 42ms
```

---

## 95th Percentile Response Time

```text
p(95)
```

Example:

```text
p(95) = 110ms
```

Meaning:

95% of all requests completed within 110ms.

---

## Failure Rate

```text
http_req_failed
```

Example:

```text
0.00%
```

All requests succeeded.

Example:

```text
5.00%
```

5% of requests failed.

Investigate:

* Authentication failures
* Database issues
* Resource exhaustion
* Application errors

---

# Identifying Performance Degradation

Watch:

```text
avg response time
p95 response time
error rate
```

Healthy:

```text
10 users -> 35ms
25 users -> 45ms
50 users -> 60ms
75 users -> 85ms
100 users -> 110ms
```

Performance degradation:

```text
10 users -> 35ms
25 users -> 40ms
50 users -> 55ms
75 users -> 500ms
100 users -> 2500ms
```

A sudden increase typically indicates:

* CPU saturation
* Database bottlenecks
* Session store contention
* Memory pressure

The first point where response times increase sharply is the application's performance threshold.

---

# Monitoring EC2 During Testing

SSH into the instance:

```bash
ssh -i your-key.pem ubuntu@<server-ip>
```

Monitor CPU and memory:

```bash
htop
```

Monitor memory:

```bash
free -h
```

Monitor application logs:

```bash
sudo journalctl -f
```

Observe resource usage while the tests are running to identify bottlenecks.
