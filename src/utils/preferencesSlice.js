import { createSlice } from "@reduxjs/toolkit";
import { MAX_PREFERENCES_PER_GROUP } from "./constants";

const STORAGE_KEY = "netflixGptPreferences";

const emptyPreferences = {
  genres: [],
  moods: [],
  eras: [],
  avoid: [],
};

// Preferences are cheap, non-sensitive and user-scoped only by browser, so
// localStorage is enough to make them feel "saved" between visits.
const loadPreferences = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) return emptyPreferences;
    return {
      genres: Array.isArray(stored.genres) ? stored.genres : [],
      moods: Array.isArray(stored.moods) ? stored.moods : [],
      eras: Array.isArray(stored.eras) ? stored.eras : [],
      avoid: Array.isArray(stored.avoid) ? stored.avoid : [],
    };
  } catch {
    return emptyPreferences;
  }
};

const persist = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing / quota exceeded — preferences just won't survive reload.
  }
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState: loadPreferences(),
  reducers: {
    togglePreference: (state, action) => {
      const { group, value } = action.payload;
      const selected = state[group];
      if (!selected) return;

      const index = selected.indexOf(value);
      if (index >= 0) {
        selected.splice(index, 1);
      } else {
        if (selected.length >= MAX_PREFERENCES_PER_GROUP) return;
        selected.push(value);

        // A genre can't be both wanted and avoided.
        if (group === "genres") {
          state.avoid = state.avoid.filter((item) => item !== value);
        } else if (group === "avoid") {
          state.genres = state.genres.filter((item) => item !== value);
        }
      }
      persist(state);
    },
    clearPreferences: (state) => {
      state.genres = [];
      state.moods = [];
      state.eras = [];
      state.avoid = [];
      persist(state);
    },
  },
});

export const { togglePreference, clearPreferences } = preferencesSlice.actions;

export default preferencesSlice.reducer;
