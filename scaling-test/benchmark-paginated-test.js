// benchmark-paginated-tasks.js

const { performance } = require("node:perf_hooks");

// ============================================
// Default configuration
// ============================================

const DEFAULTS = {
  URL: "http://localhost:4000/api/tasks",
  PAGE: 1,
  LIMIT: 50,
};

// ============================================
// CLI Argument Parser
// ============================================

function getArg(name, fallback = undefined) {
  const arg = process.argv.find((arg) => arg.startsWith(`--${name}=`));

  if (!arg) {
    return fallback;
  }

  return arg.replace(`--${name}=`, "");
}

// ============================================
// Required arguments
// ============================================

const SESSION_COOKIE = getArg("SESSION_COOKIE");

if (!SESSION_COOKIE) {
  console.error("Missing required argument:");
  console.error("");
  console.error('  --SESSION_COOKIE="connect.sid=your_session_cookie"');
  console.error("");
  console.error("Example:");
  console.error(
    '  node benchmark-paginated-tasks.js --SESSION_COOKIE="connect.sid=s%3Aabc123"',
  );

  process.exit(1);
}

// ============================================
// Optional arguments
// ============================================

const BASE_URL = getArg("URL", DEFAULTS.URL);

const PAGE = Number(getArg("PAGE", DEFAULTS.PAGE));

const LIMIT = Number(getArg("LIMIT", DEFAULTS.LIMIT));

// ============================================
// Benchmark runner
// ============================================

async function benchmarkPaginatedEndpoint() {
  const url = `${BASE_URL}?page=${PAGE}&limit=${LIMIT}`;

  console.log("====================================");
  console.log("Paginated Endpoint Benchmark");
  console.log("====================================");
  console.log(`URL: ${BASE_URL}`);
  console.log(`Page: ${PAGE}`);
  console.log(`Limit: ${LIMIT}`);
  console.log("");

  const start = performance.now();

  try {
    const response = await fetch(url, {
      headers: {
        Cookie: SESSION_COOKIE,
      },
    });

    const durationMs = performance.now() - start;

    if (!response.ok) {
      throw new Error(
        `Request failed with status ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    console.log("Request successful.");
    console.log("");

    console.log(`Response time: ${durationMs.toFixed(2)} ms`);

    if (Array.isArray(data.tasks)) {
      console.log(`Returned tasks: ${data.tasks.length}`);
    }

    if (data.total !== undefined) {
      console.log(`Total tasks: ${data.total}`);
    }

    if (data.page !== undefined) {
      console.log(`Current page: ${data.page}`);
    }

    if (data.totalPages !== undefined) {
      console.log(`Total pages: ${data.totalPages}`);
    }

    console.log("");
    console.log("Benchmark completed.");
  } catch (error) {
    const durationMs = performance.now() - start;

    console.error("");
    console.error("Benchmark failed.");
    console.error(`Elapsed before failure: ${durationMs.toFixed(2)} ms`);
    console.error(`Message: ${error.message}`);

    process.exit(1);
  }
}

benchmarkPaginatedEndpoint().catch((error) => {
  console.error("Unexpected benchmark failure:", error.message);
  process.exit(1);
});
