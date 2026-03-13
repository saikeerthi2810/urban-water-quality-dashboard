import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxSd1xnICIvOvdwcqDyQnf-npZv06_5KU",
  authDomain: "urban-water-quality-monitor.firebaseapp.com",
  projectId: "urban-water-quality-monitor",
  storageBucket: "urban-water-quality-monitor.firebasestorage.app",
  messagingSenderId: "468442356572",
  appId: "1:468442356572:web:83756e8e41599e3bbc3f99"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);