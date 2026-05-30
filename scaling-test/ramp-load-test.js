import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.URL || "http://18.119.176.95:3000";

const PASSWORD = "Password123";

let authenticated = false;

export const options = {
  vus: 1,
  duration: "10s",
};

function authenticate() {
  const email = `loadtest-user-${__VU}@example.com`;

  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email,
      password: PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  console.log(`[VU ${__VU}] Login status: ${loginResponse.status}`);

  console.log(JSON.stringify(loginResponse.cookies, null, 2));

  if (loginResponse.status === 200) {
    return;
  }

  const registerResponse = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({
      email,
      password: PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  console.log(`[VU ${__VU}] Register status: ${registerResponse.status}`);
}

export default function () {
  if (!authenticated) {
    authenticate();
    authenticated = true;
  }

  const response = http.get(`${BASE_URL}/api/tasks?page=1&limit=50`);

  console.log(`[VU ${__VU}] GET status: ${response.status}`);

  check(response, {
    "status is 200": (r) => r.status === 200,
  });

  if (response.status !== 200) {
    console.error(response.body);
  }
}
