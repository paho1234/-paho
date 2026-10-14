"use client";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AutorRol = "comprador" | "vendedor";

export type Mensaje = {
  id: string;
  autorId: string;
  autorRol: AutorRol;
  texto: string;
  creadoEn: Date | null;
};

function docToMensaje(id: string, data: DocumentData): Mensaje {
  return {
    id,
    autorId: data.autorId,
    autorRol: data.autorRol,
    texto: data.texto ?? "",
    creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : null,
  };
}

/**
 * Escucha en vivo los mensajes de un pedido, ordenados del más viejo al
 * más nuevo. Devuelve la función para dejar de escuchar (llamarla en el
 * cleanup de un useEffect). Las reglas de Firestore (ver firestore.rules)
 * ya se encargan de que solo el comprador y el vendedor de ESA orden (o
 * un admin) puedan leer esto.
 */
export function escucharMensajes(
  ordenId: string,
  onMensajes: (mensajes: Mensaje[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const ref = collection(db, "ordenes", ordenId, "mensajes");
  const q = query(ref, orderBy("creadoEn", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      onMensajes(snap.docs.map((d) => docToMensaje(d.id, d.data())));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

/**
 * Envía un mensaje nuevo. `autorId` tiene que ser el uid del usuario
 * logueado (las reglas de Firestore rechazan cualquier otro valor).
 */
export async function enviarMensaje(
  ordenId: string,
  autorId: string,
  autorRol: AutorRol,
  texto: string
): Promise<void> {
  const textoLimpio = texto.trim();
  if (!textoLimpio) return;
  const ref = collection(db, "ordenes", ordenId, "mensajes");
  await addDoc(ref, {
    autorId,
    autorRol,
    texto: textoLimpio,
    creadoEn: serverTimestamp(),
  });

  // Aviso por email a la otra parte — es de mejor esfuerzo: si esto
  // falla (red, servidor caído, etc.) el mensaje ya se guardó bien
  // arriba, así que nunca debe hacer parecer que el envío falló.
  try {
    await fetch("/api/mensajes/notificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ordenId,
        autorId,
        autorRol,
        texto: textoLimpio,
      }),
    });
  } catch {
    // Silencioso a propósito.
  }
}

/**
 * Marca el chat de un pedido como leído por este usuario (guarda la
 * fecha/hora de última lectura en usuarios/{uid}/lecturas/{ordenId}).
 * Se llama al abrir el chat y cada vez que llega un mensaje con el chat
 * abierto. Es de mejor esfuerzo: si falla, solo queda el aviso "nuevo"
 * un rato más, no se rompe nada.
 */
export async function marcarComoLeido(
  usuarioId: string,
  ordenId: string
): Promise<void> {
  await setDoc(doc(db, "usuarios", usuarioId, "lecturas", ordenId), {
    leidoEn: serverTimestamp(),
  });
}

/**
 * De una lista de pedidos, devuelve cuáles tienen un mensaje nuevo para
 * este usuario: el último mensaje del chat es de la OTRA parte y es
 * posterior a la última vez que este usuario abrió ese chat (o nunca lo
 * abrió). Hace una consulta chica por pedido; si alguna falla, ese
 * pedido simplemente no se marca.
 */
export async function pedidosConMensajeNuevo(
  usuarioId: string,
  ordenIds: string[]
): Promise<Set<string>> {
  const resultados = await Promise.all(
    ordenIds.map(async (ordenId) => {
      try {
        const ultimoSnap = await getDocs(
          query(
            collection(db, "ordenes", ordenId, "mensajes"),
            orderBy("creadoEn", "desc"),
            limit(1)
          )
        );
        if (ultimoSnap.empty) return null;
        const ultimo = ultimoSnap.docs[0].data();
        if (ultimo.autorId === usuarioId) return null;

        const lecturaSnap = await getDoc(
          doc(db, "usuarios", usuarioId, "lecturas", ordenId)
        );
        const leidoEn: Date | null = lecturaSnap.exists()
          ? lecturaSnap.data().leidoEn?.toDate?.() ?? null
          : null;
        const creadoEn: Date | null = ultimo.creadoEn?.toDate?.() ?? null;

        if (!leidoEn) return ordenId;
        if (creadoEn && creadoEn > leidoEn) return ordenId;
        return null;
      } catch {
        return null;
      }
    })
  );
  return new Set(resultados.filter((id): id is string => id !== null));
}
