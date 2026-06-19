import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBaUZzG00EBQrXjg02TeXchZM1135xBFMQ",
  authDomain: "planer-138eb.firebaseapp.com",
  projectId: "planer-138eb",
  storageBucket: "planer-138eb.firebasestorage.app",
  messagingSenderId: "507210562275",
  appId: "1:507210562275:web:1ecc4756a39a3885b9e3d6",
  measurementId: "G-5G72617HTG"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Firestore persistence: multiple tabs open, disabled");
    } else if (err.code === "unimplemented") {
      console.warn("Firestore persistence: not supported");
    }
  });
}

export default app;
