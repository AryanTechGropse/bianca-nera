// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
} from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
} from "firebase/auth";

// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsuSZe6UMU3HjJtcvOfayXrLH66ihM1qU",
  authDomain: "biancanera-website-a6426.firebaseapp.com",
  projectId: "biancanera-website-a6426",
  storageBucket: "biancanera-website-a6426.firebasestorage.app",
  messagingSenderId: "510573654010",
  appId: "1:510573654010:web:99885004eab8c673eefe43",
  measurementId: "G-WSJ8DG4BM6",
};

// ✅ Initialize Firebase safely (avoid duplicate app errors)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Initialize Analytics (only if supported)
let analytics = null;
if (typeof window !== "undefined") {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// ✅ Firebase Auth & Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// ✅ Apple Auth Provider
export const appleProvider = new OAuthProvider("apple.com");
// Configure Apple provider scopes
appleProvider.addScope("email");
appleProvider.addScope("name");

export { app, analytics };
