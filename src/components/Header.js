import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LOGO, SUPPORTED_LANGUAGES } from "../utils/constants";
import { auth } from "../utils/firebase";
import { addUser, removeUser } from "../utils/userSlice";
import { toggleSettingsView } from "../utils/gptSlice";
import { changeLanguage } from "../utils/configSlice";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
  const showSettings = useSelector((store) => store.gpt.showSettings);
  const handleSignOut = () => {
    signOut(auth)
      .then(() => {})
      .catch((error) => {
        navigate("/error");
      });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const { uid, email, displayName, photoURL } = user;
        dispatch(
          addUser({
            uid: uid,
            email: email,
            displayName: displayName,
            photoURL: photoURL,
          })
        );
        navigate("/browse");
      } else {
        dispatch(removeUser());
        navigate("/");
      }
    });

    // Unsiubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  const handleSettingsClick = () => {
    // Toggle Settings
    dispatch(toggleSettingsView());
  };

  const handleLanguageChange = (e) => {
    dispatch(changeLanguage(e.target.value));
  };

  return (
    <div className="absolute w-screen px-8 py-4 bg-black/90 backdrop-blur-sm z-50 flex flex-col md:flex-row justify-between transition-colors duration-300 border-b border-white border-opacity-10">
      <img className="w-44 mx-auto md:mx-0 drop-shadow-md" src={LOGO} alt="logo" />
      {user && (
        <div className="flex p-2 justify-between items-center">
          {showSettings && (
            <select
              className="p-2 m-2 bg-gray-900 text-white rounded-lg shadow-sm border border-gray-700 outline-none"
              onChange={handleLanguageChange}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.identifier} value={lang.identifier}>
                  {lang.name}
                </option>
              ))}
            </select>
          )}
          <button
            className="py-2 px-6 mx-4 my-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition-colors"
            onClick={handleSettingsClick}
          >
            {showSettings ? "Homepage" : "Settings"}
          </button>
          <img
            className="hidden md:block w-12 h-12 rounded-full border-2 border-gray-700 shadow-md"
            alt="usericon"
            src={user?.photoURL}
          />
          <button onClick={handleSignOut} className="ml-4 font-bold text-red-500 hover:text-red-400 transition-colors">
            (Sign Out)
          </button>
        </div>
      )}
    </div>
  );
};
export default Header;
