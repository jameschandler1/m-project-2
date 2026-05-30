import http from "k6/http";
import { check } from "k6";

const BASE_URL =
__ENV.URL || "http://18.119.176.95:3000";

const PASSWORD = "Password123";

let sessionCookie = null;

export const options = {
stages: [
{ duration: "24s", target: 10 },
{ duration: "24s", target: 25 },
{ duration: "24s", target: 50 },
{ duration: "24s", target: 75 },
{ duration: "24s", target: 100 },
],
};

function authenticate() {
const email =
`loadtest-user-${__VU}@example.com`;

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
}
);



if (loginResponse.status === 200) {
const cookie = console.log(JSON.stringify(loginResponse.cookies, null, 2));


if (!cookie) {
  throw new Error(
    `[VU ${__VU}] Login succeeded but no session cookie returned`
  );
}

return `sid=${cookie}`;


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
}
);

const cookie =
registerResponse.cookies.sid?.[0]?.value;

if (!cookie) {
console.error(
`[VU ${__VU}] Authentication failure`
);

console.error(
  `Login Status: ${loginResponse.status}`
);

console.error(
  `Login Body: ${loginResponse.body}`
);

console.error(
  `Register Status: ${registerResponse.status}`
);

console.error(
  `Register Body: ${registerResponse.body}`
);

throw new Error(
  `[VU ${__VU}] Could not authenticate`
);


}

return `sid=${cookie}`;
}

export default function () {
if (!sessionCookie) {
sessionCookie = authenticate();
}

const response = http.get(
`${BASE_URL}/api/tasks?page=1&limit=50`,
{
headers: {
Cookie: sessionCookie,
},
}
);

check(response, {
"status is 200": (r) => r.status === 200,
});

if (response.status !== 200) {
console.error(
`[VU ${__VU}] Request failed`
);

console.error(
  `Status: ${response.status}`
);

console.error(
  response.body.slice(0, 1000)
);


}
}
