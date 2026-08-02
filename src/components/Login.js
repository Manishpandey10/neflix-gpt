import { useState, useRef } from "react";
import Header from "./Header";
import { getAuthErrorMessage, validateForm } from "../utils/validate";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../utils/firebase";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { USER_AVATAR } from "../utils/constants";
import ThreeBackground from "./ThreeBackground";

const Field = ({ label, error, children }) => (
  <label className="block mb-4">
    <span className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
      {label}
    </span>
    {children}
    {error && <span className="block mt-1.5 text-sm text-red-400">{error}</span>}
  </label>
);

const inputClass = (hasError) =>
  "w-full px-4 py-3 rounded-lg bg-white bg-opacity-10 border text-white " +
  "placeholder-gray-500 outline-none transition-colors " +
  "focus:bg-opacity-15 focus:ring-2 shadow-sm " +
  (hasError
    ? "border-red-500 focus:ring-red-500"
    : "border-white border-opacity-20 focus:border-transparent focus:ring-red-600");

const Login = () => {
  const [isSignInForm, setIsSignInForm] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  const name = useRef(null);
  const email = useRef(null);
  const password = useRef(null);

  const handleButtonClick = async () => {
    if (isSubmitting) return;

    const values = {
      name: name.current?.value,
      email: email.current.value,
      password: password.current.value,
      isSignUp: !isSignInForm,
    };

    const fieldErrors = validateForm(values);
    setErrors(fieldErrors);
    setFormError(null);
    if (Object.keys(fieldErrors).length) return;

    setIsSubmitting(true);
    try {
      if (isSignInForm) {
        await signInWithEmailAndPassword(auth, values.email, values.password);
      } else {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        await updateProfile(user, {
          displayName: values.name.trim(),
          photoURL: USER_AVATAR,
        });
        const { uid, email: mail, displayName, photoURL } = auth.currentUser;
        dispatch(addUser({ uid, email: mail, displayName, photoURL }));
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSignInForm = () => {
    setIsSignInForm(!isSignInForm);
    setErrors({});
    setFormError(null);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <Header />
      <ThreeBackground />

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row items-center justify-center px-4 py-28 gap-12 md:gap-20">
        
        {/* Hero Section */}
        <div className="text-center md:text-left text-white max-w-lg px-4 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
            AI-Powered Discoveries
          </h1>
          <p className="text-xl md:text-3xl text-gray-300 font-medium drop-shadow-md">
            Your next favorite story, curated just for you by advanced AI.
          </p>
        </div>

        {/* Auth Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleButtonClick();
          }}
          className="w-full max-w-md p-8 md:p-10 rounded-2xl bg-black bg-opacity-75 backdrop-blur-md border border-white border-opacity-10 shadow-2xl text-white transition-colors duration-300"
        >
          <h1 className="font-bold text-3xl mb-1">
            {isSignInForm ? "Sign In" : "Create your account"}
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            {isSignInForm
              ? "Pick up where you left off."
              : "Tell us your taste and we'll find your next favourite."}
          </p>

          {!isSignInForm && (
            <Field label="Full name" error={errors.name}>
              <input
                ref={name}
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                className={inputClass(errors.name)}
              />
            </Field>
          )}

          <Field label="Email" error={errors.email}>
            <input
              ref={email}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass(errors.email)}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                ref={password}
                type={showPassword ? "text" : "password"}
                autoComplete={isSignInForm ? "current-password" : "new-password"}
                placeholder="••••••••"
                className={inputClass(errors.password) + " pr-16"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </Field>

          {formError && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-lg bg-red-950 bg-opacity-80 border border-red-700 text-red-200 text-sm"
            >
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 mt-2 bg-red-700 hover:bg-red-600 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {isSubmitting && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSignInForm ? "Sign In" : "Sign Up"}
          </button>

          <p className="mt-6 text-sm text-gray-400">
            {isSignInForm ? "New to Netflix?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={toggleSignInForm}
              className="text-white font-semibold hover:underline"
            >
              {isSignInForm ? "Sign up now" : "Sign in now"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
export default Login;
