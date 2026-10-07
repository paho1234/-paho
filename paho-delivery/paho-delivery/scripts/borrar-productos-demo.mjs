// Borra SOLO los productos de ejemplo que cargó scripts/seed.mjs —
// identificados por sus vendedorId de prueba, que nunca corresponden a
// una cuenta real de Firebase Auth. No toca productos publicados por
// vendedores reales a través de la app.
//
// Uso: node scripts/borrar-productos-demo.mjs
//
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, "..", "service-account.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
} catch {
  console.error(
    "No encontré service-account.json en la raíz del proyecto."
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Mismos IDs que scripts/seed.mjs — nunca son UIDs reales de Firebase Auth.
const VENDEDORES_DEMO = [
  "patagonia-home",
  "challenge",
  "repuestos-del-sur",
  "hodaia-hogar",
  "andes-trail",
  "liquidacion-norte",
];

async function borrar() {
  let total = 0;
  for (const vendedorId of VENDEDORES_DEMO) {
    const snap = await db
      .collection("productos")
      .where("vendedorId", "==", vendedorId)
      .get();

    for (const doc of snap.docs) {
      console.log(`Borrando: ${doc.data().titulo} (${vendedorId})`);
      await doc.ref.delete();
      total++;
    }
  }
  console.log(`\nListo: ${total} productos de prueba borrados.`);
}

borrar().catch((err) => {
  console.error("Error borrando productos:", err);
  process.exit(1);
});
