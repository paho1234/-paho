"use client";

import { collection, doc, getDoc, getDocs, query, where, orderBy, updateDoc, serverTimestamp, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FacturacionComprador, Envio, ItemOrden, EstadoEntrega } from "@/lib/ordenes";

export type PedidoVendedor = {
  id: string;
  compradorId: string;
  items: ItemOrden[];
  total: number;
  facturacion: FacturacionComprador;
  envio: Envio;
  estado: "pendiente_pago" | "pagado" | "cancelado";
  entrega: EstadoEntrega;
  entregaConfirmadaEn: Date | null;
  creadoEn: Date | null;
};

function docToPedido(id: string, data: DocumentData): PedidoVendedor {
  return {
    id,
    compradorId: data.compradorId,
    items: data.items ?? [],
    total: data.total ?? 0,
    // FIX: mismo motivo que `envio` abajo — un documento viejo/incompleto
    // sin `facturacion` rompía la UI en `p.facturacion.nombre`.
    facturacion: data.facturacion ?? {
      nombre: "(sin nombre)",
      tipoDocumento: "DNI",
      numeroDocumento: "-",
      condicionIVA: "consumidor_final",
    },
    // FIX: pedidos guardados antes de que `envio` existiera en el
    // modelo de datos (o cualquier documento incompleto) no tienen este
    // campo. Sin el respaldo, `p.envio.metodo` en la UI explota con
    // "Cannot read properties of undefined". Como salvaguarda,
    // asumimos "retiro" (la opción más simple / sin costo) para no
    // inventar una dirección de envío que no existe.
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
 * Lista los pedidos donde el vendedor logueado participa. Requiere un
 * índice compuesto (vendedorId + creadoEn) en la colección `ordenes` —
 * si Firestore tira un error de índice faltante la primera vez que se
 * usa esto, el error trae un link para crearlo con un clic, igual que
 * pasó con `productos`.
 */
export async function getPedidosDeVendedor(
  vendedorId: string
): Promise<PedidoVendedor[]> {
  const ref = collection(db, "ordenes");
  const q = query(
    ref,
    where("vendedorId", "==", vendedorId),
    orderBy("creadoEn", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToPedido(d.id, d.data()));
}

export async function getPedido(id: string): Promise<PedidoVendedor | null> {
  const snap = await getDoc(doc(db, "ordenes", id));
  if (!snap.exists()) return null;
  return docToPedido(snap.id, snap.data());
}

/**
 * Estilo Mercado Libre: el vendedor confirma la entrega a mano. Las
 * reglas de Firestore solo dejan tocar `entrega` y
 * `entregaConfirmadaEn` en este update — cualquier otro campo queda
 * protegido, aunque este código intentara mandarlo (ver firestore.rules).
 */
export async function confirmarEntrega(ordenId: string): Promise<void> {
  await updateDoc(doc(db, "ordenes", ordenId), {
    entrega: "entregado",
    entregaConfirmadaEn: serverTimestamp(),
  });
}
