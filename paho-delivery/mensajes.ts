"use client";

import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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
}
