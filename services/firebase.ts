import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDMN3D2ghLboXbXCR3EJ53gJTuEeYR9N8Y",
  authDomain: "earm-db1ec.firebaseapp.com",
  databaseURL: "https://earm-db1ec-default-rtdb.firebaseio.com",
  projectId: "earm-db1ec",
  storageBucket: "earm-db1ec.firebasestorage.app",
  messagingSenderId: "553343790547",
  appId: "1:553343790547:web:45dde3d5acb4fccb14d326",
  measurementId: "G-LH6TMD5PND"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Messaging
// Note: This might fail in environments without Service Workers (like some dev containers)
// or non-HTTPS environments, so we wrap it.
let messaging = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn('Firebase Messaging not supported in this environment:', err);
}
export { messaging };

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code == 'unimplemented') {
    console.warn('Persistence not supported by browser');
  }
});