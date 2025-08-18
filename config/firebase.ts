import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // 👈 Web SDK only
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {};

const app = initializeApp(firebaseConfig);

// ⚠️ No persistence override here, Expo will default to memory auth.
// User will need to re-login after app reload unless you manually rehydrate.
const auth = getAuth(app);
const db = getFirestore(app, "vetsnap-database");
const storage = getStorage(app);

export { app, auth, db, storage };
