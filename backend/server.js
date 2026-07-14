const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

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

app.post("/api/gpt-search", gptLimiter, async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string" || query.length > 200) {
    return res.status(400).json({ error: "Invalid query" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt =
      "Act as a movie recommendation system and suggest movies for the query: " +
      query +
      ". Reply with ONLY 5 movie titles, comma separated, nothing else. " +
      "Example: Gadar, Sholay, Don, Golmaal, Koi Mil Gaya";

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const movieNames = text
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (!movieNames.length) {
      return res.status(502).json({ error: "No suggestions returned" });
    }

    res.json({ movieNames });
  } catch (err) {
    console.error("Gemini error:", err.message);
    res.status(502).json({ error: "AI search failed, please try again" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));