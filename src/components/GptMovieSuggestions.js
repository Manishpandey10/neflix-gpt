import { useSelector } from "react-redux";
import MovieList from "./MovieList";

const SkeletonRow = () => (
  <div className="px-6 mb-6">
    <div className="h-6 w-40 bg-white/10 rounded-lg mb-4 animate-pulse" />
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-36 md:w-48 aspect-[2/3] rounded-xl bg-white/5 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  </div>
);

const GptMovieSuggestions = () => {
  const { movieResults, movieNames, isLoading } = useSelector(
    (store) => store.gpt
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-10 p-6 rounded-2xl glass animate-fade-in">
        <div className="flex items-center gap-3 mb-6 px-6">
          <span className="inline-block w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm font-medium">AI is finding your perfect movies...</span>
        </div>
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (!movieNames) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mt-10 p-6 rounded-2xl glass text-white animate-scale-in">
      <div className="flex items-center gap-3 mb-4 px-6">
        <span className="text-xl">✨</span>
        <h2 className="text-lg font-semibold text-gray-300">
          AI Picked These For You
        </h2>
      </div>
      {movieNames.map((movieName, index) => (
        <MovieList
          key={movieName}
          title={movieName}
          movies={movieResults[index]}
        />
      ))}
    </div>
  );
};
export default GptMovieSuggestions;
