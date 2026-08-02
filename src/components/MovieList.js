import MovieCard from "./MovieCard";

const MovieList = ({ title, movies }) => {
  // The AI sometimes returns a title TMDB can't match — skip the empty rail.
  if (!movies?.length) return null;

  return (
    <div className="px-6 mb-6">
      <h2 className="text-lg md:text-2xl font-bold py-4 text-white flex items-center gap-3">
        <span className="w-1 h-6 bg-red-600 rounded-full" />
        {title}
      </h2>
      <div className="flex overflow-x-auto pb-3 scrollbar-hide">
        <div className="flex">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              posterPath={movie.poster_path}
              title={movie.original_title}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
export default MovieList;
