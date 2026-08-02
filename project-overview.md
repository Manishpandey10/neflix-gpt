# Netflix GPT — Project Overview

A Netflix-clone SPA with an AI-powered movie search. Users authenticate with Firebase Auth, browse
TMDB movie rails with an autoplaying YouTube trailer hero, and can switch to a "GPT Search" view
where a natural-language prompt is sent to Google Gemini, which returns 5 movie titles that are then
resolved against the TMDB search API and rendered as suggestion rails.

- **Stack:** React 18 (Create React App), Redux Toolkit, React Router v6, TailwindCSS, Firebase Auth
- **AI:** Google Gemini (`gemini-2.5-flash`) via `@google/generative-ai`
- **Data:** TMDB REST API v3
- **Hosting:** Firebase Hosting — https://netflix-gpt-872e4.web.app
- **Optional backend:** Express proxy in `backend/` (see *Two Parallel Architectures* below)

---

## ⚠️ Read This First: Two Parallel Architectures

The repo currently contains **two incompatible versions of the app**, and only one of them is wired up.

| | `src/` (**ACTIVE**) | `frontend/` + `backend/` (**INACTIVE**) |
|---|---|---|
| Built by CRA? | Yes — CRA only compiles `src/` | No — `frontend/` is never imported |
| TMDB access | Direct browser → TMDB, bearer token in bundle | Browser → Express proxy → TMDB, token server-side |
| Gemini access | Direct browser → Gemini, API key in bundle | Browser → Express proxy → Gemini, key server-side |
| Firebase config | Hardcoded literals in source | Read from `process.env` |
| Rate limiting | None | 10 req/min on AI endpoint |

`frontend/` contains only two files (`utils/firebase.js`, `utils/constants.js`) — the beginnings of a
migration to the proxy architecture, committed in `2662b0e "structural changes"`. **No component
imports them.** The `backend/` Express server is fully written and functional but nothing calls it.

**Implication:** the deployed app ships the TMDB bearer token, the Gemini API key, and the Firebase
config in its public JavaScript bundle. Finishing the `frontend/`+`backend/` migration is the single
highest-value piece of outstanding work. See *Known Issues* for the full list.

---

## Module List

### Application shell
| Module | File | Role |
|---|---|---|
| Entry point | `src/index.js` | Mounts `<App />`. `React.StrictMode` is commented out. |
| App | `src/App.js` | Wraps `<Body />` in the Redux `<Provider>` |
| Body / Router | `src/components/Body.js` | Defines the two-route browser router |

### Auth
| Module | File | Role |
|---|---|---|
| Login | `src/components/Login.js` | Combined Sign In / Sign Up form (toggled by local state) |
| Validation | `src/utils/validate.js` | Regex email + password rules |
| Firebase client | `src/utils/firebase.js` | Initializes Firebase app, exports `auth` |

### Browse
| Module | File | Role |
|---|---|---|
| Browse | `src/components/Browse.js` | Page shell; switches between browse view and GPT view |
| Header | `src/components/Header.js` | Logo, auth listener, sign-out, GPT toggle, language selector |
| MainContainer | `src/components/MainContainer.js` | Hero section for `nowPlayingMovies[0]` |
| VideoBackground | `src/components/VideoBackground.js` | Autoplay/muted YouTube trailer iframe |
| VideoTitle | `src/components/VideoTitle.js` | Hero title, overview, Play / More Info buttons (non-functional) |
| SecondaryContainer | `src/components/SecondaryContainer.js` | Stacks five `MovieList` rails |
| MovieList | `src/components/MovieList.js` | Horizontally scrolling row of cards |
| MovieCard | `src/components/MovieCard.js` | Single poster image |

### GPT Search
| Module | File | Role |
|---|---|---|
| GptSearch | `src/components/GptSearch.js` | Layout wrapper with background image |
| GptSearchBar | `src/components/GptSearchBar.js` | Prompt input; calls Gemini then TMDB; dispatches results |
| GptMovieSuggestions | `src/components/GptMovieSuggestions.js` | One `MovieList` rail per suggested title |
| Language strings | `src/utils/languageConstants.js` | UI copy for `en` / `hindi` / `spanish` |

### State
| Module | File | Role |
|---|---|---|
| Store | `src/utils/appStore.js` | Combines the four reducers |
| userSlice | `src/utils/userSlice.js` | Authenticated user |
| moviesSlice | `src/utils/moviesSlice.js` | TMDB movie lists + trailer |
| gptSlice | `src/utils/gptSlice.js` | GPT view toggle + AI results |
| configSlice | `src/utils/configSlice.js` | Selected UI language |

### Data fetching
| Module | File | Role |
|---|---|---|
| useNowPlayingMovies | `src/hooks/useNowPlayingMovies.js` | Fetches TMDB now-playing on mount |
| usePopularMovies | `src/hooks/usePopularMovies.js` | Fetches TMDB popular on mount |
| useMovieTrailer | `src/hooks/useMovieTrailer.js` | Fetches + filters YouTube trailer for a movie |

### Dead / orphaned code
| Module | File | Status |
|---|---|---|
| OpenAI client | `src/utils/openai.js` | **Broken.** Imports `OPENAI_KEY` from `constants.js`, which no longer exports it → `apiKey: undefined`. Nothing imports this file. Superseded by Gemini. Safe to delete along with the `openai` dependency. |
| Proxy-aware Firebase | `frontend/utils/firebase.js` | Not imported by anything |
| Proxy-aware constants | `frontend/utils/constants.js` | Not imported by anything |
| Express proxy | `backend/server.js` | Functional but unreferenced by the client |

---

## Main Business Flows

### 1. Sign Up
`Login.js` → validate → `createUserWithEmailAndPassword` → `updateProfile` (displayName + default
avatar) → `dispatch(addUser)` → `onAuthStateChanged` in `Header` fires → `navigate("/browse")`.

Note the explicit `dispatch(addUser)` after `updateProfile` exists because `onAuthStateChanged`
fires before the profile update lands, so the listener alone would store a user with a null
`displayName`/`photoURL`.

### 2. Sign In
`Login.js` → validate → `signInWithEmailAndPassword` → the `.then` handler does nothing; the
`onAuthStateChanged` listener in `Header` is what populates the store and redirects.

### 3. Route guarding (implicit)
There is no route-guard component. `Header` is rendered by **both** `Login` and `Browse`, and its
`onAuthStateChanged` effect performs the redirect in both directions:

- user present → `navigate("/browse")`
- user absent → `navigate("/")`

The effect has an empty dependency array and unsubscribes on unmount. This is the only auth gate —
`/browse` renders briefly before the listener resolves.

### 4. Browse page load
`Browse` mounts → `useNowPlayingMovies()` and `usePopularMovies()` fire in parallel → each dispatches
into `moviesSlice` → `MainContainer` reads `nowPlayingMovies[0]` → `VideoBackground` calls
`useMovieTrailer(id)` → trailer key stored → iframe renders → `SecondaryContainer` renders five rails.

All three hooks short-circuit if their slice value is already populated (`!value && fetch()`), so
navigating away and back does not refetch.

### 5. GPT Search
Header "GPT Search" button → `toggleGptSearchView` → `Browse` swaps `MainContainer`/`SecondaryContainer`
for `GptSearch`. Then in `GptSearchBar`:

1. Read prompt from a `useRef` input; bail if empty
2. Instantiate `GoogleGenerativeAI` with `REACT_APP_GEMINI_KEY` **in the browser**
3. Send a prompt asking for exactly 5 comma-separated titles
4. `text.split(",").map(trim)` — no validation of count or format
5. Fan out one TMDB `/search/movie` call per title via `Promise.all`
6. `dispatch(addGptMovieResult({ movieNames, movieResults }))`
7. `GptMovieSuggestions` renders one rail per title

Failures are caught and only `console.error`'d — the user sees nothing happen.

### 6. Language switching
Only visible while the GPT view is active. `changeLanguage` writes an identifier into `configSlice`;
`GptSearchBar` looks up `lang[langKey]` for its placeholder and button label. The language affects
**UI copy only** — it is not passed to Gemini or TMDB, so results are always English.

### 7. Sign Out
Header button → `signOut(auth)` → listener fires with `null` → `removeUser` → `navigate("/")`.
The error branch navigates to `/error`, **which is not a defined route**.

---

## Important Models

These are shapes, not classes — the app is untyped and stores raw API payloads.

### Redux state tree
```js
{
  user:   null | { uid, email, displayName, photoURL },

  movies: {
    nowPlayingMovies: null | TmdbMovie[],
    popularMovies:    null | TmdbMovie[],
    trailerVideo:     null | TmdbVideo,
  },

  gpt: {
    showGptSearch: boolean,
    movieNames:    null | string[],        // AI-suggested titles
    movieResults:  null | TmdbMovie[][],   // index-aligned with movieNames
  },

  config: { lang: "en" | "hindi" | "spanish" },
}
```

### `TmdbMovie` (fields actually consumed)
`id`, `original_title`, `overview`, `poster_path` — the full TMDB object is stored, but only these
four are read.

### `TmdbVideo` (from `/movie/{id}/videos`)
`key` (YouTube id), `type`. `useMovieTrailer` prefers the first entry with `type === "Trailer"` and
falls back to `results[0]`.

### Validation rules (`validate.js`)
- Email: `/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/`
- Password: min 8 chars, ≥1 digit, ≥1 lowercase, ≥1 uppercase
- Returns an error string, or `null` when valid
- **Not applied to the Sign Up name field** — an empty display name is accepted

---

## Services

### Firebase Auth (`src/utils/firebase.js`)
Project `netflix-gpt-872e4`. Config values are **hardcoded literals**, not env vars.

Two issues in this file:
- `getAuth()` is called with **no `app` argument**. It works only because `initializeApp` registered
  a default instance first — fragile, and inconsistent with `frontend/utils/firebase.js` which
  correctly passes `getAuth(app)`.
- `getAnalytics(app)` is assigned to an unused local, so it initializes as a side effect only.

Used APIs: `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `updateProfile`,
`onAuthStateChanged`, `signOut`.

### TMDB (`src/utils/constants.js` → `API_OPTIONS`)
Bearer token from `REACT_APP_TMDB_KEY`, injected at build time and therefore **present in the public
bundle**. Endpoints are hardcoded as string concatenations inside each hook rather than centralized.

### Google Gemini (`src/components/GptSearchBar.js`)
The client is constructed **inside the click handler on every search**, with the API key read from
`REACT_APP_GEMINI_KEY`. Also **in the public bundle**. Three `console.log` statements in this
component print the API key to the browser console.

`constants.js` exports an unused `GEMINI_KEY` — the component reads `process.env` directly instead.

### YouTube
No API client. `VideoBackground` builds an embed URL directly:
`https://www.youtube.com/embed/{key}?&autoplay=1&mute=1`

---

## APIs

### Consumed directly by the browser (active path)
| Method | Endpoint | Caller |
|---|---|---|
| GET | `api.themoviedb.org/3/movie/now_playing?page=1` | `useNowPlayingMovies` |
| GET | `api.themoviedb.org/3/movie/popular?page=1` | `usePopularMovies` |
| GET | `api.themoviedb.org/3/movie/{id}/videos?language=en-US` | `useMovieTrailer` |
| GET | `api.themoviedb.org/3/search/movie?query=…` | `GptSearchBar` |
| SDK | Gemini `generateContent` (`gemini-2.5-flash`) | `GptSearchBar` |

### Exposed by `backend/server.js` (built, not yet consumed)
| Method | Route | Notes |
|---|---|---|
| GET | `/api/tmdb/movie/:category` | Allow-list: `now_playing`, `popular`, `top_rated`, `upcoming`. Rejects anything else with 400. |
| GET | `/api/tmdb/movie/:movieId/videos` | No validation on `movieId` |
| GET | `/api/tmdb/search?query=` | 400 if `query` missing; value is URL-encoded |
| POST | `/api/gpt-search` | Body `{ query }`. Rate-limited. Validates type and ≤200 chars. Calls Gemini, splits on commas, caps at 5, returns `{ movieNames }`. |

TMDB failures return 502 `{ error: "Failed to reach TMDB" }`. Gemini failures log server-side and
return 502 `{ error: "AI search failed, please try again" }` — the underlying error is not leaked.

Server env vars: `TMDB_KEY`, `GEMINI_KEY`, `FRONTEND_URL`, `PORT` (default 5000).

---

## Background Jobs

**None.** No cron, no queues, no workers, no service worker, no scheduled functions. All work is
request-scoped and user-initiated.

The only automated recurring process is CI:

**`.github/workflows/firebase-hosting-pull-request.yml`** — on `pull_request`, for same-repo PRs
only: checkout → `npm run build` → deploy a Firebase Hosting preview channel.

Two gaps in this workflow:
- No `npm ci` / `npm install` step before `npm run build`
- No `actions/setup-node` step, so it runs on whatever Node the runner defaults to

There is no merge/production deploy workflow — deploys to the live channel are manual
(`firebase deploy`).

---

## Important Middleware

### Frontend
No middleware in the HTTP sense. The Redux store uses `configureStore` defaults (thunk +
immutability/serializability checks in dev), and no custom middleware is registered. There are also
no route loaders, guards, or error boundaries.

The closest analogue is the **`onAuthStateChanged` effect in `Header.js`**, which acts as the app's
de-facto auth middleware — see *Route guarding* above.

### Backend (`backend/server.js`), in order
1. `express.json()` — JSON body parsing
2. `cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" })` — single-origin allow-list
3. `gptLimiter` — `express-rate-limit`, 10 requests per 60s, applied **only** to `POST /api/gpt-search`

There is no auth middleware on the proxy: any caller who can reach it can spend the TMDB and Gemini
quota. Rate limiting is per-IP and in-memory, so it resets on restart and does not work across
multiple instances.

---

## Folder Structure

```
neflix-gpt/
├── .github/workflows/
│   └── firebase-hosting-pull-request.yml   # PR preview deploy
├── .firebase/                              # Firebase CLI hosting cache
├── backend/                                # Express proxy — built, NOT wired up
│   ├── server.js                           #   4 routes, CORS, rate limiting
│   └── package.json                        #   separate dependency tree
├── frontend/                               # Partial migration — NOT wired up
│   └── utils/
│       ├── firebase.js                     #   env-var Firebase config
│       └── constants.js                    #   BACKEND_URL + endpoint builders
├── public/                                 # CRA static shell, icons, manifest
├── src/                                    # THE APP — everything CRA builds
│   ├── components/                         # 13 presentational + container components
│   ├── hooks/                              # 3 data-fetching hooks
│   ├── utils/                              # Redux slices, Firebase, constants, validation
│   ├── App.js  index.js  index.css
│   ├── reportWebVitals.js  setupTests.js
├── .env.example                            # stale — see Known Issues
├── package.json                            # CRA app manifest
├── tailwind.config.js
└── README.md                               # chronological build log + setup notes
```

**Conventions observed in `src/`:**
- One component per file, arrow-function components, default exports
- Redux slices live in `utils/`, not a `store/` or `features/` folder
- Data fetching is exclusively in `hooks/`; components never fetch — **except `GptSearchBar`**, which
  calls both Gemini and TMDB inline
- Styling is Tailwind utility classes inline; `index.css` holds only the Tailwind directives
- No TypeScript, no PropTypes, no barrel files, no path aliases

`src/services/` is listed in `.gitignore` but does not exist.

---

## Known Issues

Ordered roughly by severity.

**Secrets exposed in the client bundle.** The TMDB bearer token, the Gemini API key, and the Firebase
config all ship to the browser. The Gemini key in particular is billable and unrestricted — anyone can
extract it from the deployed bundle. The `backend/` proxy exists to fix exactly this but is not
connected. *(Firebase web API keys are public by design and are the least concerning of the three,
but hardcoding rather than env-injecting them is still inconsistent with the rest of the config.)*

**API key logged to the console.** `GptSearchBar.js:12` and `:42` `console.log` the Gemini key on
every render and every search.

**Three hardcoded rails show wrong data.** `SecondaryContainer` passes `nowPlayingMovies` to the
"Trending", "Upcoming Movies", and "Horror" rails. Only "Now Playing" and "Popular" are real. The
backend already exposes `top_rated` and `upcoming` categories to fix two of these.

**Unhandled GPT search failures.** A Gemini error is only `console.error`'d — no loading state, no
error message, no disabled button. The user clicks Search and nothing visibly happens.

**No response validation from the AI.** `text.split(",")` assumes the model obeyed the format. A
prose response yields garbage titles and a burst of nonsense TMDB queries. The backend version at
least caps the result at 5.

**`navigate("/error")` targets a nonexistent route** (`Header.js:20`) — a sign-out failure lands the
user on a blank screen. There is no `errorElement` on the router either.

**Dead code.** `src/utils/openai.js` is broken (imports a no-longer-exported `OPENAI_KEY`) and unused;
the `openai`, `@google/genai`, and `web-vitals` dependencies are all unreferenced by active code.

**`.env.example` is stale.** It lists `REACT_APP_OPENAI_KEY`, `REACT_APP_BASE_URL`,
`REACT_APP_FIREBASE_KEY`, and `REACT_APP_FIREBASE_APP_ID` — none of which the code reads. It is
missing `REACT_APP_GEMINI_KEY`, which the code *does* read, and `REACT_APP_TMDB_KEY` has a stray `e`
as its value. It also does not cover the backend's `TMDB_KEY` / `GEMINI_KEY` / `FRONTEND_URL`.

**Dependencies in the wrong section.** `@reduxjs/toolkit`, `react-router-dom`, and `tailwindcss` are
in `devDependencies` despite being required at runtime / build time. This works with CRA but will
break any `npm install --production` flow.

**No tests.** `setupTests.js` and the Testing Library packages are present, but there is not a single
test file. `npm test` runs zero tests.

**`React.StrictMode` is commented out** in `index.js` — likely to suppress the double-effect behavior
that would cause the fetch hooks to fire twice in development, rather than fixing the hooks.

**Hook dependency arrays are empty** while the functions they call close over props and Redux state
(`useMovieTrailer` closes over `movieId`). Correct today only because the hero movie never changes.

**Trailer state is a single slot.** `moviesSlice.trailerVideo` holds one video and `useMovieTrailer`
guards with `!trailerVideo`, so the trailer will never update if the hero movie ever becomes dynamic.

**Login form submit.** The `<button>` inside `<form>` has no `type`, so it defaults to `submit`;
this is neutralized by `onSubmit={(e) => e.preventDefault()}`, but pressing Enter in a field submits
without running `handleButtonClick`.

---

## Getting Started

```bash
npm install
# create .env in the project root:
#   REACT_APP_TMDB_KEY=<TMDB v4 read access token>
#   REACT_APP_GEMINI_KEY=<Google AI Studio key>
npm start      # http://localhost:3000
npm run build  # production bundle
```

To run the (currently unused) proxy:

```bash
cd backend && npm install
# backend/.env:
#   TMDB_KEY=…  GEMINI_KEY=…  FRONTEND_URL=http://localhost:3000  PORT=5000
npm run dev
```

Note: `.env`, `.firebaserc`, and `firebase.json` are all gitignored, so a fresh clone cannot deploy
to Firebase without re-running `firebase init`.
