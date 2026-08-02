import { IMG_CDN_URL } from "../utils/constants";

const MovieCard = ({ posterPath, title }) => {
  if (!posterPath) return null;
  return (
    <div className="shrink-0 w-36 md:w-48 pr-4 group cursor-pointer">
      <div className="relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-red-900/30 group-hover:scale-105 group-hover:z-10">
        <img
          className="w-full rounded-xl transition-all duration-300 group-hover:brightness-110"
          alt={title || "Movie poster"}
          loading="lazy"
          src={IMG_CDN_URL + posterPath}
        />
        {/* Hover overlay with title */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <p className="text-white text-sm font-semibold leading-tight line-clamp-2 drop-shadow-lg">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
};
export default MovieCard;
