import { useSelector } from "react-redux";
import GptMovieSuggestions from "./GptMovieSuggestions";
import GptSearchBar from "./GptSearchBar";

const GPTSearch = () => {
  const { movieNames, isLoading } = useSelector((store) => store.gpt);
  const hasResults = Boolean(movieNames) || isLoading;

  return (
    <div
      className={
        "min-h-screen flex flex-col px-4 pb-16 pt-28 items-center " +
        (hasResults ? "justify-start" : "justify-center")
      }
    >
      {/* ─── Hero Section (before search) ─── */}
      {!hasResults && (
        <div className="text-center text-white mb-10 md:mb-14 max-w-4xl px-4">
          {/* Animated badge */}
          <div className="animate-fade-in-up mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold uppercase tracking-widest text-gray-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Powered by Gemini AI
            </span>
          </div>

          {/* Headline with shimmer */}
          <h1 className="animate-fade-in-up-delay-1 text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.95] text-shimmer animate-shimmer">
            Discover Your Next
            <br />
            <span className="text-white drop-shadow-[0_0_30px_rgba(229,9,20,0.4)]">
              Obsession
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up-delay-2 text-lg md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Tell us your mood, your vibe, or the kind of adventure you crave.
            Our AI curates the{" "}
            <span className="text-white font-semibold">perfect watchlist</span>{" "}
            just for you.
          </p>

          {/* Stats row */}
          <div className="animate-fade-in-up-delay-3 flex items-center justify-center gap-8 mt-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">🎬</span>
              <span>500K+ Movies</span>
            </div>
            <div className="w-px h-4 bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">🤖</span>
              <span>AI-Powered</span>
            </div>
            <div className="w-px h-4 bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">⚡</span>
              <span>Instant Results</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Search + Results ─── */}
      <div className="w-full max-w-7xl flex flex-col items-center animate-scale-in">
        <GptSearchBar />
        <GptMovieSuggestions />
      </div>
    </div>
  );
};
export default GPTSearch;
