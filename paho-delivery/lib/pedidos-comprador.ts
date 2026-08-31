"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Envio, ItemOrden, EstadoEntrega } from "@/lib/ordenes";

export type PedidoComprador = {
  id: string;
  vendedorId: string;
  items: ItemOrden[];
  total: number;
  envio: Envio;
  estado: "pendiente_pago" | "pagado" | "cancelado";
  entrega: EstadoEntrega;
  entregaConfirmadaEn: Date | null;
  creadoEn: Date | null;
};

function docToPedido(id: string, data: DocumentData): PedidoComprador {
  return {
    id,
    vendedorId: data.vendedorId,
    items: data.items ?? [],
    total: data.total ?? 0,
    // Mismo respaldo que en lib/pedidos-vendedor.ts: un documento viejo
    // o incompleto sin `envio` no debe romper la UI del comprador.
    envio: data.envio ?? {
      metodo: "retiro",
      costo: 0,
      direccion: null,
      telefonoContacto: null,
      direccionRetiro: null,
    },
    estado: data.estado,
    entrega: data.entrega ?? "pendiente",
    entregaConfirmadaEn: data.entregaConfirmadaEn?.toDate
      ? data.entregaConfirmadaEn.toDate()
      : null,
    creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : null,
  };
}

/**
 * Lista los pedidos del comprador logueado ("Mis compras"). Requiere un
 * índice compuesto (compradorId + creadoEn) en la colección `ordenes` —
 * el mismo patrón que el índice (vendedorId + creadoEn) que ya se usa
 * en el panel del vendedor. Si falta, Firestore tira un error con un
 * link para crearlo con un clic.
 */
export async function getPedidosDeComprador(
  compradorId: string
): Promise<PedidoComprador[]> {
  const ref = collection(db, "ordenes");
  const q = query(
    ref,
    where("compradorId", "==", compradorId),
    orderBy("creadoEn", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToPedido(d.id, d.data()));
}

export async function getPedidoComprador(
  id: string
): Promise<PedidoComprador | null> {
  const snap = await getDoc(doc(db, "ordenes", id));
  if (!snap.exists()) return null;
  return docToPedido(snap.id, snap.data());
}
