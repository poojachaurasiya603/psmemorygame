// Load Firebase config and init here
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// The user is supposed to add their Firebase .env variables here.
const firebaseConfig = {
    apiKey: "AIzaSyCR8YehHzRARpCcGDATStow0Xbz6h4a8v8",
    authDomain: "psmemorygame.firebaseapp.com",
    projectId: "psmemorygame",
    storageBucket: "psmemorygame.firebasestorage.app",
    messagingSenderId: "605995921695",
    appId: "1:605995921695:web:3bb5c4791a7d6a9fb5002a",
    measurementId: "G-66BL2QRHV5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
