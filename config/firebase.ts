// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration

import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";
const firebaseConfig = {
  apiKey: "AIzaSyAv4M6HIaR9OaMaTxsAN5h8TPc249ATKwU",
  authDomain: "expense-tracker-fffc5.firebaseapp.com",
  projectId: "expense-tracker-fffc5",
  storageBucket: "expense-tracker-fffc5.firebasestorage.app",
  messagingSenderId: "742074355540",
  appId: "1:742074355540:web:9b4fc90932b5421df0c2c1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

//db
export const firestore = getFirestore(app);
