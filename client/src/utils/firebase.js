
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "auto-interview-8d4ea.firebaseapp.com",
  projectId: "auto-interview-8d4ea",
  storageBucket: "auto-interview-8d4ea.firebasestorage.app",
  messagingSenderId: "190907588344",
  appId: "1:190907588344:web:00d68d7eb857e11165e50d",
  measurementId: "G-9TGSS1WCX1"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export {auth,provider}