import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

// Solo para código de servidor (API routes). Nunca importar esto desde un
// componente cliente ("use client") — usa credenciales privadas.
//
// En producción (Netlify/Vercel), configurar estas tres variables de
// entorno en el panel del hosting, tomadas del mismo JSON de cuenta de
// servicio que se usa en scripts/seed.mjs:
//   FIREBASE_ADMIN_PROJECT_ID
//   FIREBASE_ADMIN_CLIENT_EMAIL
//   FIREBASE_ADMIN_PRIVATE_KEY   (con los \n literales escapados)

let app: App;

function getAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Faltan credenciales de Firebase Admin (FIREBASE_ADMIN_PROJECT_ID / " +
        "FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY). " +
        "Ver .env.local.example."
    );
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return app;
}

export function getAdminDb() {
  return getAdminFirestore(getAdminApp());
}
