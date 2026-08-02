const dns = require("dns");
const { Resolver } = dns.promises;

// Use Cloudflare + Google DNS to bypass ISP blocks (e.g. TMDB blocked in India)
const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8", "1.0.0.1", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

// Override Node's default DNS lookup to use our custom resolver
const { lookup: originalLookup } = dns;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  resolver
    .resolve4(hostname)
    .then((addresses) => {
      callback(null, addresses[0], 4);
    })
    .catch(() => {
      // Fallback to default lookup if custom resolver fails
      originalLookup(hostname, options, callback);
    });
};

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { GoogleGenAI, Type } = require("@google/genai");

require("dotenv").config();

const app = express();
app.use(express.json());

// Allow all origins during development
app.use(cors());

// Ensure CORS headers are always present (even on errors)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const tmdbHeaders = {
  accept: "application/json",
  Authorization: `Bearer ${TMDB_KEY}`,
};

const gptLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please slow down." },
});

app.get("/api/tmdb/movie/:category", async (req, res) => {
  const allowed = ["now_playing", "popular", "top_rated", "upcoming"];
  const { category } = req.params;
  if (!allowed.includes(category)) {
    return res.status(400).json({ error: "Unknown category" });
  }
  try {
    const tmdbRes = await fetch(
      `${TMDB_BASE}/movie/${category}?page=1&language=en-US`,
      { headers: tmdbHeaders }
    );
    const data = await tmdbRes.json();
    res.status(tmdbRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to reach TMDB" });
  }
});

app.get("/api/tmdb/movie/:movieId/videos", async (req, res) => {
  const { movieId } = req.params;
  try {
    const tmdbRes = await fetch(
      `${TMDB_BASE}/movie/${movieId}/videos?language=en-US`,
      { headers: tmdbHeaders }
    );
    const data = await tmdbRes.json();
    res.status(tmdbRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to reach TMDB" });
  }
});

app.get("/api/tmdb/search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query" });
  try {
    const tmdbRes = await fetch(
      `${TMDB_BASE}/search/movie?query=${encodeURIComponent(
        query
      )}&include_adult=false&language=en-US&page=1`,
      { headers: tmdbHeaders }
    );
    const data = await tmdbRes.json();
    res.status(tmdbRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to reach TMDB" });
  }
});

/* ------------------------------------------------------------------ *
 * GPT search
 * ------------------------------------------------------------------ */

// Must mirror the vocabularies in src/utils/constants.js.
const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
];
const MOODS = [
  "Feel-good",
  "Dark & gritty",
  "Edge-of-seat",
  "Thought-provoking",
  "Light & funny",
  "Romantic",
  "Epic",
  "Mind-bending",
];
const ERAS = ["2020s", "2010s", "2000s", "90s", "80s", "Classic"];

const MAX_PER_GROUP = 4;

// Dropping anything not on the allow-list keeps the prompt bounded and stops
// the request body being used to inject instructions into the model.
const clean = (values, allowed) =>
  Array.isArray(values)
    ? [...new Set(values)]
        .filter((v) => allowed.includes(v))
        .slice(0, MAX_PER_GROUP)
    : [];

const normalizePreferences = (raw = {}) => ({
  genres: clean(raw.genres, GENRES),
  moods: clean(raw.moods, MOODS),
  eras: clean(raw.eras, ERAS),
  avoid: clean(raw.avoid, GENRES),
});

// Compact key=value encoding rather than prose — same signal, far fewer tokens.
const buildPrompt = (query, prefs) => {
  const parts = [];
  if (query) parts.push(`q=${query}`);
  if (prefs.genres.length) parts.push(`like=${prefs.genres.join(",")}`);
  if (prefs.moods.length) parts.push(`mood=${prefs.moods.join(",")}`);
  if (prefs.eras.length) parts.push(`era=${prefs.eras.join(",")}`);
  if (prefs.avoid.length) parts.push(`avoid=${prefs.avoid.join(",")}`);
  return parts.join("|");
};

// Static, so it stays identical across requests and stays cache-friendly.
const SYSTEM_INSTRUCTION =
  "You are a movie recommendation engine. Input is a compact key=value line: " +
  "q=free-text request, like=preferred genres, mood=desired tone, era=release period, " +
  "avoid=genres to exclude. Return exactly 5 real, released films that best fit. " +
  "Treat 'avoid' as a hard exclusion and 'q' as the strongest signal. " +
  "If 'q' is missing, rely entirely on the provided preferences. " +
  "Return only official English titles, no years, no commentary.";

const RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: { type: Type.STRING },
  minItems: 5,
  maxItems: 5,
};

// Identical searches are common (tweaking one chip, re-running). Serving those
// from memory is the single biggest saving on API spend.
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const cache = new Map();

const cacheGet = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  // Refresh recency for the LRU eviction below.
  cache.delete(key);
  cache.set(key, hit);
  return hit.movieNames;
};

const cacheSet = (key, movieNames) => {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { movieNames, at: Date.now() });
};

app.post("/api/gpt-search", gptLimiter, async (req, res) => {
  const { query, preferences } = req.body;
  const prefs = normalizePreferences(preferences);
  
  const hasPreferences =
    prefs.genres.length > 0 ||
    prefs.moods.length > 0 ||
    prefs.eras.length > 0 ||
    prefs.avoid.length > 0;

  if (
    (typeof query !== "string" && !hasPreferences) ||
    (typeof query === "string" && query.length > 200) ||
    (!query && !hasPreferences)
  ) {
    return res.status(400).json({ error: "Invalid query or missing preferences" });
  }

  const prompt = buildPrompt((query || "").trim(), prefs);
  const cacheKey = prompt.toLowerCase();

  const cached = cacheGet(cacheKey);
  if (cached) {
    return res.json({ movieNames: cached, cached: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // 2.5-flash reasons by default; a 5-title lookup does not need it and
        // the thinking tokens dominate the bill when left on.
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 128,
        temperature: 0.8,
      },
    });

    let movieNames;
    try {
      movieNames = JSON.parse(response.text);
    } catch {
      return res.status(502).json({ error: "Unexpected response from AI" });
    }

    movieNames = (Array.isArray(movieNames) ? movieNames : [])
      .filter((name) => typeof name === "string" && name.trim())
      .map((name) => name.trim())
      .slice(0, 5);

    if (!movieNames.length) {
      return res.status(502).json({ error: "No suggestions returned" });
    }

    cacheSet(cacheKey, movieNames);
    res.json({ movieNames, cached: false });
  } catch (err) {
    console.error("Gemini error:", err.message);
    res.status(502).json({ error: "AI search failed, please try again" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
