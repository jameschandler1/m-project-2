import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.URL || "http://18.119.176.95:4000";
const USER_COUNT = 100;
const PASSWORD = "Password123";

// Track stage metrics
let currentStage = 0;
let stageMetrics = {
  0: { requests: 0, failures: 0, totalTime: 0 },
  1: { requests: 0, failures: 0, totalTime: 0 },
  2: { requests: 0, failures: 0, totalTime: 0 },
};

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
};

// Authenticate once per VU at startup
export function setup() {
  console.log(`[SETUP] Starting authentication for VU ${__VU}`);

  // Select a random user from the pre-generated users
  const userIndex = Math.floor(Math.random() * USER_COUNT) + 1;
  const email = `loadtest-user-${userIndex}@example.com`;

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: email,
    password: PASSWORD,
  }), {
    headers: { "Content-Type": "application/json" },
  });

  if (loginRes.status !== 200) {
    console.error(`[LOGIN FAIL] Status=${loginRes.status}, Body=${loginRes.body}`);
    throw new Error(`Login failed for user ${email}`);
  }

  // Extract JWT token from login response
  try {
    const body = JSON.parse(loginRes.body);
    console.log(`[SETUP] VU ${__VU} authenticated as ${email}`);
    return { token: body.token, email };
  } catch (e) {
    console.error(`[LOGIN PARSE ERROR] ${e.message}`);
    throw new Error(`Failed to parse login response for user ${email}`);
  }
}

export default function (data) {
  // Determine current stage based on time
  const elapsed = new Date() - __VU_STARTED_AT;
  if (elapsed < 30000) {
    currentStage = 0;
  } else if (elapsed < 90000) {
    if (currentStage === 0) {
      console.log(`[STAGE 1] Starting sustained load at 100 VUs`);
      logStageMetrics(0);
    }
    currentStage = 1;
  } else {
    if (currentStage === 1) {
      console.log(`[STAGE 2] Starting ramp-down`);
      logStageMetrics(1);
    }
    currentStage = 2;
  }

  // Make authenticated request to tasks endpoint with JWT token
  const headers = {
    Authorization: `Bearer ${data.token}`,
  };

  const startTime = new Date();
  const response = http.get(`${BASE_URL}/api/tasks?page=1&limit=50`, {
    headers: headers,
  });
  const endTime = new Date();
  const responseTime = endTime - startTime;

  // Track metrics for current stage
  stageMetrics[currentStage].requests++;
  stageMetrics[currentStage].totalTime += responseTime;

  check(response, {
    "tasks status is 200": (r) => r.status === 200,
  });

  if (response.status !== 200) {
    stageMetrics[currentStage].failures++;
    console.error(`[TASKS FAIL] Status=${response.status}, Body=${response.body}`);
    console.error(`[DEBUG] User: ${data.email}`);
    console.error(`[DEBUG] Token: ${data.token ? data.token.substring(0, 20) + '...' : 'null'}`);
  }
}

function logStageMetrics(stage) {
  const metrics = stageMetrics[stage];
  if (metrics.requests === 0) return;

  const avgResponseTime = metrics.totalTime / metrics.requests;
  const failureRate = (metrics.failures / metrics.requests) * 100;

  console.log(`[STAGE ${stage} COMPLETE]`);
  console.log(`  Requests: ${metrics.requests}`);
  console.log(`  Failures: ${metrics.failures} (${failureRate.toFixed(2)}%)`);
  console.log(`  Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
}

export function teardown(data) {
  logStageMetrics(currentStage);
  console.log(`[TEARDOWN] VU ${__VU} finished`);
}
