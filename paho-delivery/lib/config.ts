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
  try {
    const snap = await getDoc(doc(db, "config", "banner"));
    const texto = snap.exists() ? (snap.data().texto as string) : null;
    return texto?.trim() ? texto : BANNER_TEXTO_DEFAULT;
  } catch {
    // Si Firestore rechaza la lectura (por ejemplo, si las reglas de
    // seguridad todavía no se publicaron desde Firebase Console) no
    // tiene sentido tirar abajo TODO el home por un banner — mejor
    // mostrar el texto por defecto y que el resto del sitio funcione.
    return BANNER_TEXTO_DEFAULT;
  }
}

export async function setBannerTexto(texto: string): Promise<void> {
  await setDoc(doc(db, "config", "banner"), { texto }, { merge: true });
}
