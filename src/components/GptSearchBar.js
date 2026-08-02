import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import lang from "../utils/languageConstants";
import { GPT_SEARCH_ENDPOINT, TMDB_ENDPOINTS } from "../utils/constants";
import {
  addGptMovieResult,
  gptSearchFailed,
  gptSearchStarted,
} from "../utils/gptSlice";
import PreferenceChips from "./PreferenceChips";

const GptSearchBar = () => {
  const dispatch = useDispatch();
  const langKey = useSelector((store) => store.config.lang);
  const preferences = useSelector((store) => store.preferences);
  const { isLoading, error } = useSelector((store) => store.gpt);
  const searchText = useRef(null);

  const searchMovieTMDB = async (movie) => {
    const res = await fetch(TMDB_ENDPOINTS.search(movie));
    if (!res.ok) return [];
    const json = await res.json();
    return json.results || [];
  };

  const handleGptSearchClick = async () => {
    const query = searchText.current?.value.trim() || "";
    const hasPreferences =
      preferences.genres.length > 0 ||
      preferences.moods.length > 0 ||
      preferences.eras.length > 0 ||
      preferences.avoid.length > 0;

    if ((!query && !hasPreferences) || isLoading) return;

    dispatch(gptSearchStarted());

    try {
      const res = await fetch(GPT_SEARCH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, preferences }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          res.status === 429
            ? lang[langKey].errorRateLimited
            : body.error || lang[langKey].errorGeneric;
        dispatch(gptSearchFailed(message));
        return;
      }

      const { movieNames } = await res.json();
      if (!movieNames?.length) {
        dispatch(gptSearchFailed(lang[langKey].errorNoResults));
        return;
      }

      const movieResults = await Promise.all(movieNames.map(searchMovieTMDB));
      dispatch(addGptMovieResult({ movieNames, movieResults }));
    } catch (err) {
      dispatch(gptSearchFailed(lang[langKey].errorNetwork));
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Search form with glow pulse animation */}
      <form
        className="w-full max-w-3xl glass rounded-2xl p-4 grid grid-cols-12 gap-3 shadow-2xl animate-glow-pulse transition-all duration-500 hover:border-red-500/30"
        onSubmit={(e) => {
          e.preventDefault();
          handleGptSearchClick();
        }}
      >
        {/* Search icon + input */}
        <div className="col-span-12 sm:col-span-9 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl pointer-events-none">
            🔍
          </span>
          <input
            ref={searchText}
            type="text"
            disabled={isLoading}
            className="w-full pl-12 pr-6 py-4 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-gray-500 border border-white/10 outline-none focus:bg-white/10 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/30 disabled:opacity-50 transition-all text-lg"
            placeholder={lang[langKey].gptSearchPlaceholder}
          />
        </div>

        {/* Search button */}
        <button
          type="submit"
          disabled={isLoading}
          className="col-span-12 sm:col-span-3 py-4 px-6 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 active:from-red-800 active:to-red-700 disabled:from-red-900 disabled:to-red-900 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 text-lg hover:shadow-red-600/60 hover:scale-[1.02] active:scale-[0.98]"
          onClick={handleGptSearchClick}
        >
          {isLoading && (
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isLoading ? lang[langKey].searching : lang[langKey].search}
        </button>
      </form>

      {/* Preference chips section */}
      <div className="mt-8 w-full max-w-3xl">
        <PreferenceChips />
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="w-full max-w-3xl mt-6 px-6 py-4 rounded-xl glass border-red-700/50 text-red-200 shadow-xl animate-fade-in-up"
        >
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GptSearchBar;
