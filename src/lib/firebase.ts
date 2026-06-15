import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAtYi-egh1H48vumo_Y_t6zl_4NKF4pPyE",
  authDomain: "tracker-planner-85d87.firebaseapp.com",
  projectId: "tracker-planner-85d87",
  storageBucket: "tracker-planner-85d87.firebasestorage.app",
  messagingSenderId: "971848279039",
  appId: "1:971848279039:web:dc3b61d588c2a492a3bdca"
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
