// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional



const firebaseConfig = {
  apiKey: "AIzaSyCXCrSCuga4W9jVgtYOz0abzqXhDl2CKXk",
  authDomain: "netflix-gpt-872e4.firebaseapp.com",
  projectId: "netflix-gpt-872e4",
  storageBucket: "netflix-gpt-872e4.firebasestorage.app",
  messagingSenderId: "900650219967",
  appId: "1:900650219967:web:830109b0e18618263b890a",
  measurementId: "G-59ZK2Z2NBE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export const auth = getAuth(app);
