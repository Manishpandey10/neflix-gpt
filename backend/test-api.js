const http = require("http");

const tests = [
  {
    name: "TMDB Now Playing",
    path: "/api/tmdb/movie/now_playing",
    method: "GET",
    validate: (data) => {
      if (!data.results || !data.results.length) return "No movies returned";
      return `✅ Got ${data.results.length} movies. First 3: ${data.results.slice(0, 3).map(m => m.original_title).join(", ")}`;
    },
  },
  {
    name: "TMDB Popular",
    path: "/api/tmdb/movie/popular",
    method: "GET",
    validate: (data) => {
      if (!data.results || !data.results.length) return "No movies returned";
      return `✅ Got ${data.results.length} movies.`;
    },
  },
  {
    name: "TMDB Search (query=Inception)",
    path: "/api/tmdb/search?query=Inception",
    method: "GET",
    validate: (data) => {
      if (!data.results || !data.results.length) return "No search results";
      return `✅ Found ${data.results.length} results. Top: ${data.results[0].original_title}`;
    },
  },
  {
    name: "TMDB Movie Videos",
    path: "/api/tmdb/movie/27205/videos",
    method: "GET",
    validate: (data) => {
      if (!data.results) return "No video data returned";
      return `✅ Got ${data.results.length} video(s) for Inception.`;
    },
  },
];

function makeRequest(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: test.path,
      method: test.method,
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 400) {
            resolve(`❌ ${test.name}: HTTP ${res.statusCode} — ${data.error || "Unknown error"}`);
          } else {
            resolve(`${test.name}: ${test.validate(data)}`);
          }
        } catch {
          resolve(`❌ ${test.name}: Could not parse response`);
        }
      });
    });

    req.on("error", (err) => {
      resolve(`❌ ${test.name}: ${err.message} (Is the backend running on port 5000?)`);
    });

    req.on("timeout", () => {
      req.destroy();
      resolve(`❌ ${test.name}: Request timed out`);
    });

    req.end();
  });
}

async function runTests() {
  console.log("═══════════════════════════════════════");
  console.log("  API KEY VERIFICATION TEST SUITE");
  console.log("═══════════════════════════════════════\n");

  for (const test of tests) {
    const result = await makeRequest(test);
    console.log(result);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  TESTS COMPLETE");
  console.log("═══════════════════════════════════════");
}

runTests();
