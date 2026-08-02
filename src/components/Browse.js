import Header from "./Header";
import useNowPlayingMovies from "../hooks/useNowPlayingMovies";
import usePopularMovies from "../hooks/usePopularMovies";
import Settings from "./Settings";
import GptSearch from "./GptSearch";
import ThreeBackground from "./ThreeBackground";
import { useSelector } from "react-redux";

const Browse = () => {
  const showSettings = useSelector((store) => store.gpt.showSettings);

  useNowPlayingMovies();
  usePopularMovies();

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Fixed Three.js background — stays behind everything */}
      <ThreeBackground />

      {/* Content layer */}
      <div className="relative z-10">
        <Header />
        {showSettings ? <Settings /> : <GptSearch />}
      </div>
    </div>
  );
};
export default Browse;
