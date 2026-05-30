import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.URL || "http://18.119.176.95:4000";
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

  // Extract session cookie from login response
  let sessionCookie = null;
  if (loginRes.cookies && loginRes.cookies.sid && loginRes.cookies.sid.length > 0) {
    sessionCookie = `sid=${loginRes.cookies.sid[0].value}`;
  }

  return { loginRes, sessionCookie };
}

export default function () {
  // Authenticate first
  const { loginRes, sessionCookie } = authenticate();

  // Make authenticated request to tasks endpoint with session cookie
  const headers = {};
  if (sessionCookie) {
    headers.Cookie = sessionCookie;
  }

  const response = http.get(`${BASE_URL}/api/tasks?page=1&limit=50`, {
    headers: headers,
  });

  check(response, {
    "tasks status is 200": (r) => r.status === 200,
  });

  if (response.status !== 200) {
    console.error(`[TASKS FAIL] Status=${response.status}, Body=${response.body}`);
    console.error(`[DEBUG] Session cookie: ${sessionCookie}`);
    console.error(`[DEBUG] Login status: ${loginRes.status}`);
    console.error(`[DEBUG] Tasks response cookies: ${JSON.stringify(response.cookies)}`);
  }
}
