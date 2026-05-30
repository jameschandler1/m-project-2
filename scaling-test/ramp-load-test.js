export default function () {
  if (!authenticated) {
    authenticate();
    authenticated = true;
  }

  const response = http.get(`${BASE_URL}/api/tasks?page=1&limit=50`);

  console.log("================================");
  console.log(`LOGIN COMPLETE: ${authenticated}`);
  console.log(`STATUS: ${response.status}`);
  console.log(`BODY: ${response.body}`);
  console.log("================================");
}
