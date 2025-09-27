import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCkoynSVBp3YJzwnaLBiLYz8sK1PJE3V4o",
    authDomain: "codemint-b6f4a.firebaseapp.com",
    projectId: "codemint-b6f4a",
    storageBucket: "codemint-b6f4a.firebasestorage.app",
    messagingSenderId: "158563807965",
    appId: "1:158563807965:web:39e9df8be1858ef1816134"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider };