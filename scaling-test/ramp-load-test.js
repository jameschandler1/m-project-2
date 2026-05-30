import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.URL || "http://18.119.176.95:3000";
const USER_COUNT = 100;
const PASSWORD = "Password123";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
};

// Authenticate with a random pre-generated user
function authenticate() {
  // Select a random user from the pre-generated users
  const userIndex = Math.floor(Math.random() * USER_COUNT) + 1;
  const email = `loadtest-user-${userIndex}@example.com`;

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: email,
    password: PASSWORD,
  }), {
    headers: { "Content-Type": "application/json" },
  });

  check(loginRes, {
    "login status is 200": (r) => r.status === 200,
  });

  if (loginRes.status !== 200) {
    console.error(`[LOGIN FAIL] Status=${loginRes.status}, Body=${loginRes.body}`);
  }

  return loginRes;
}

export default function () {
  // Authenticate first
  authenticate();

  // Make authenticated request to tasks endpoint
  const response = http.get(`${BASE_URL}/api/tasks?page=1&limit=50`);

  check(response, {
    "tasks status is 200": (r) => r.status === 200,
  });

  if (response.status !== 200) {
    console.error(`[TASKS FAIL] Status=${response.status}, Body=${response.body}`);
  }
}
