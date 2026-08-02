export const checkValidData = (email, password) => {
  const isEmailValid = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(
    email
  );
  const isPasswordValid =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(password);

  if (!isEmailValid) return "Email ID is not valid";
  if (!isPasswordValid) return "Password is not valid";

  return null;
};

/**
 * Per-field validation so the form can highlight the offending input instead of
 * showing one message underneath everything.
 */
export const validateForm = ({ name, email, password, isSignUp }) => {
  const errors = {};

  if (isSignUp && (!name || name.trim().length < 2)) {
    errors.name = "Please enter your name";
  }

  if (!/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(email || "")) {
    errors.email = "Enter a valid email address";
  }

  if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password || "")) {
    errors.password =
      "At least 8 characters, with an uppercase, a lowercase and a number";
  }

  return errors;
};

// Firebase returns codes like "auth/invalid-credential" inside a noisy message
// string. The old form printed that raw — map to plain English instead.
const AUTH_ERRORS = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Please choose a stronger password.",
  "auth/too-many-requests": "Too many attempts. Please try again shortly.",
  "auth/network-request-failed": "Network problem. Check your connection.",
  "auth/operation-not-allowed":
    "Email sign-in is not enabled for this Firebase project.",
};

export const getAuthErrorMessage = (error) =>
  AUTH_ERRORS[error?.code] || "Something went wrong. Please try again.";
