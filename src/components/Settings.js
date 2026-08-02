import { useSelector } from "react-redux";

const Settings = () => {
  const user = useSelector((store) => store.user);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent pt-28 px-4 pb-12 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-black bg-opacity-75 backdrop-blur-md rounded-2xl shadow-2xl border border-white border-opacity-10 p-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-8 border-b border-white border-opacity-10 pb-4">
          Account Settings
        </h1>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="flex-shrink-0">
            <img
              src={user.photoURL || "https://occ-0-6247-2164.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABdpkabKqQAibiQEA01CREQwPKSn5E_EQQNKp0N8N22BCAK9C92e3i6a_tQxL6Kq7rK60nF2wXFw-B3k84jQW1c1wXwEw9H0.png"}
              alt="Profile Avatar"
              className="w-32 h-32 rounded-xl shadow-lg border-4 border-gray-800 object-cover"
            />
          </div>
          
          <div className="flex-grow space-y-6 w-full text-center md:text-left">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Display Name
              </p>
              <p className="text-xl font-medium text-white bg-black bg-opacity-50 border border-white border-opacity-10 py-2 px-4 rounded-lg inline-block md:block">
                {user.displayName || "Netflix User"}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Email Address
              </p>
              <p className="text-xl font-medium text-white bg-black bg-opacity-50 border border-white border-opacity-10 py-2 px-4 rounded-lg inline-block md:block">
                {user.email}
              </p>
            </div>
            
            <div className="pt-4">
              <button className="bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-md">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
