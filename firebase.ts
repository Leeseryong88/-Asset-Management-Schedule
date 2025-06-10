// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoWUnC-KpTfSz3dBjgFPsyHBZ210SZHww",
  authDomain: "asset-management-schedule.firebaseapp.com",
  projectId: "asset-management-schedule",
  storageBucket: "asset-management-schedule.firebasestorage.app",
  messagingSenderId: "325273892209",
  appId: "1:325273892209:web:799fc10bf1266b88a632d0",
  measurementId: "G-9PZVFYPCEC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics
export const analytics = getAnalytics(app);

export default app; 