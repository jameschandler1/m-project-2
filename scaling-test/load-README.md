# Scaling Test Suite

This directory contains scripts used to benchmark and load test the Task Tracking application.

The goal of these tests is to measure:

* Homepage performance under concurrent load
* Database read performance under concurrent load
* Pagination performance under concurrent load

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

See the official k6 installation guide.

---

## Verify Backend Is Running

For local testing:

```bash
cd backend
npm start
```

For deployed testing:

```text
http://<server-ip>:3000
```

---

# Directory Contents

```text
scaling-test/
├── README.md
├── seed-loadtest-users.js
├── load-test.js
├── ramp-load-test.js
├── taskep-load-test.js
└── auth-helper.js
```

---

# Load Test Users

The authenticated benchmarks require users with task data.

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

Password:

```text
Password123
```

---

# Create Load Test Data

Run from project root:

```bash
node scaling-test/seed-loadtest-users.js
```

Expected result:

```text
100 users
10,000 tasks
```

This only needs to be run once unless the database is reset.

---

# Test 1: Homepage Load Test

Purpose:

Simulate 50 concurrent users hitting the homepage for 30 seconds.

Endpoint:

```text
GET /
```

Run:

```bash
cd scaling-test

k6 run load-test.js
```

Expected behavior:

* No authentication required
* Exercises Express routing
* Exercises network stack
* Minimal database activity

---

# Test 2: Database Read Ramp Test

Purpose:

Gradually increase load from 10 to 100 concurrent users over approximately 2 minutes.

Endpoint:

```text
GET /api/tasks?page=1&limit=50
```

Run:

```bash
cd scaling-test

k6 run ramp-load-test.js
```

Expected behavior:

Each virtual user:

1. Attempts login
2. Registers if login fails
3. Obtains a session cookie
4. Repeatedly requests paginated tasks

This test exercises:

* Session validation
* MySQL session storage
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
