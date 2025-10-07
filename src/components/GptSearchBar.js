import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import lang from "../utils/languageConstants";
import { API_OPTIONS } from "../utils/constants";
import { addGptMovieResult } from "../utils/gptSlice";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GptSearchBar = () => {
  const dispatch = useDispatch();
  const langKey = useSelector((store) => store.config.lang);
  const searchText = useRef(null);
  console.log("Gemini key:", process.env.REACT_APP_GEMINI_KEY);

  // ✅ TMDB Search Function (unchanged)
  const searchMovieTMDB = async (movie) => {
    const data = await fetch(
      "https://api.themoviedb.org/3/search/movie?query=" +
        movie +
        "&include_adult=false&language=en-US&page=1",
      API_OPTIONS
    );
    const json = await data.json();
    return json.results;
  };

  // ✅ Gemini Search Handler
  const handleGptSearchClick = async () => {
    const query = searchText.current.value.trim();
    if (!query) return;

    console.log("Searching for:", query);

    // ✅ Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_KEY);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const gptQuery =
      "Act as a Movie Recommendation system and suggest some movies for the query: " +
      query +
      ". Only give me names of 5 movies, comma separated like this example: Gadar, Sholay, Don, Golmaal, Koi Mil Gaya";
    console.log("Gemini key:", process.env.REACT_APP_GEMINI_KEY);
    try {
      // ✅ Ask Gemini
      const result = await model.generateContent(gptQuery);
      const response = await result.response;
      const text = response.text();

      console.log("Gemini result:", text);

      // 🧠 Parse comma-separated list into array
      const gptMovies = text.split(",").map((m) => m.trim());

      // 🔍 Search TMDB for each movie
      const promiseArray = gptMovies.map((movie) => searchMovieTMDB(movie));
      const tmdbResults = await Promise.all(promiseArray);

      dispatch(
        addGptMovieResult({ movieNames: gptMovies, movieResults: tmdbResults })
      );
    } catch (err) {
      console.error("Gemini API Error:", err);
      // alert("Gemini API Error: " + err.message);
    }
  };

  return (
    <div className="pt-[35%] md:pt-[10%] flex justify-center">
      <form
        className="w-full md:w-1/2 bg-black grid grid-cols-12"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          ref={searchText}
          type="text"
          className="p-4 m-4 col-span-9"
          placeholder={lang[langKey].gptSearchPlaceholder}
        />
        <button
          className="col-span-3 m-4 py-2 px-4 bg-red-700 text-white rounded-lg"
          onClick={handleGptSearchClick}
        >
          {lang[langKey].search}
        </button>
      </form>
    </div>
  );
};

export default GptSearchBar;
