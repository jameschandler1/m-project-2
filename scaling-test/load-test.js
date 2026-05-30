import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.URL || "http://18.119.176.95:3000";

export const options = {
  vus: 50,
  duration: "30s",
};

export default function () {
  const response = http.get(BASE_URL);

  check(response, {
    "status is 200": (r) => r.status === 200,
  });

  if (response.status !== 200) {
    console.error(`[FAIL] Status=${response.status}`);
    console.error(response.body);
  }
}
