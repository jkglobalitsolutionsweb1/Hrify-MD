// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage"; // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyBpKGYSyRl9RG-QQX6C0O__DqAo0DV0Sj8",
  authDomain: "hrify-7b064.firebaseapp.com",
  projectId: "hrify-7b064",
  storageBucket: "hrify-7b064.firebasestorage.app",
  messagingSenderId: "35467087640",
  appId: "1:35467087640:web:b1f57175993a281371d86d",
  measurementId: "G-F43DN9PBLZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app); // Correctly get Firestore instance
const storage = getStorage(app);  // Initialize Firebase Storage

export { auth, firestore, storage }; // No db export needed
