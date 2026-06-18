// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCyxYs4VZUzNbGO5MFqecjNaKh5pxGOnos",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sura-codex.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sura-codex",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sura-codex.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "403235335582",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:403235335582:web:b3ad558da010a299cc7a8f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-W3FEHS40P3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let analyticsInstance: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) analyticsInstance = getAnalytics(app);
    })
    .catch(() => {
      analyticsInstance = null;
    });
}
export const analytics = analyticsInstance;

// Auth
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export const db = getFirestore(app);
export const storage = getStorage(app);
