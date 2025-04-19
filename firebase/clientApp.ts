// /firebase/clientApp.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth }                         from "firebase/auth";
import { getFirestore }                    from "firebase/firestore";

const firebaseConfig = {
  apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // …etc.
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth     = getAuth(app);
export const firestore = getFirestore(app);
