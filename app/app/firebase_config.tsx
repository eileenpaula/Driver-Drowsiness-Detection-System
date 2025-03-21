// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBn7Wd5vpBuZRmmZu_b6_zSlOie-BM8lTo",
  authDomain: "drowsy-driver-4645b.firebaseapp.com",
  projectId: "drowsy-driver-4645b",
  storageBucket: "drowsy-driver-4645b.firebasestorage.app",
  messagingSenderId: "1087498228221",
  appId: "1:1087498228221:web:a5ab2c29ebde6710534994",
  measurementId: "G-6623BB2E11"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
