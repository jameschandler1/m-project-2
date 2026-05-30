import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.URL || "http://18.119.176.95:4000";
const USER_COUNT = 100;
const PASSWORD = "Password123";

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
};

// Authenticate once per VU at startup
export function setup() {
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
    return { token: body.token, email };
  } catch (e) {
    console.error(`[LOGIN PARSE ERROR] ${e.message}`);
    throw new Error(`Failed to parse login response for user ${email}`);
  }
}

export default function (data) {
  // Make authenticated request to tasks endpoint with JWT token
  const headers = {
    Authorization: `Bearer ${data.token}`,
  };

  const response = http.get(`${BASE_URL}/api/tasks?page=1&limit=50`, {
    headers: headers,
  });

  check(response, {
    "tasks status is 200": (r) => r.status === 200,
  });

  if (response.status !== 200) {
    console.error(`[TASKS FAIL] Status=${response.status}, Body=${response.body}`);
    console.error(`[DEBUG] User: ${data.email}`);
    console.error(`[DEBUG] Token: ${data.token ? data.token.substring(0, 20) + '...' : 'null'}`);
  }
}
