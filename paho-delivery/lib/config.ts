import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const BANNER_TEXTO_DEFAULT =
  "Devoluciones y liquidaciones de marcas reales · hasta 70% menos · condición declarada, sin sorpresas";

/**
 * Texto del banner promocional del home. Vive en config/banner (colección
 * `config`, un solo documento). Si nunca se editó desde /admin, el
 * documento no existe todavía — en ese caso se usa un texto por defecto,
 * para que el sitio nunca se quede sin banner.
 */
export async function getBannerTexto(): Promise<string> {
  const snap = await getDoc(doc(db, "config", "banner"));
  const texto = snap.exists() ? (snap.data().texto as string) : null;
  return texto?.trim() ? texto : BANNER_TEXTO_DEFAULT;
}

export async function setBannerTexto(texto: string): Promise<void> {
  await setDoc(doc(db, "config", "banner"), { texto }, { merge: true });
}
