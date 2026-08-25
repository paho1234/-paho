import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Reemplazar con las credenciales del proyecto Firebase de PAHO.
// Podés usar el mismo patrón que en FacturApp / Caja Diaria: variables de
// entorno en Netlify/Vercel, nunca hardcodeadas en el repo.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Auth y Storage se inicializan de forma perezosa (recién cuando se
// llaman, siempre desde componentes cliente/navegador). Si se
// inicializaran a nivel de módulo, Next.js los ejecuta durante
// "collecting page data" en el build, y con credenciales inválidas o
// ausentes en ese momento el build entero se rompe.
let _auth: Auth | null = null;
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(app);
  return _auth;
}

let _storage: FirebaseStorage | null = null;
export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(app);
  return _storage;
}

export default app;
