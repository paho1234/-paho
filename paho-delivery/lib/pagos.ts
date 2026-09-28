"use client";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Costo por vender en la plataforma: 15% fijo sobre el total de cada
 * venta con pago confirmado, sin excepciones por categoría ni por
 * vendedor. Se calcula al vuelo (no se guarda en la orden) para que un
 * eventual cambio futuro de porcentaje no requiera migrar datos viejos
 * — la comisión que aplica a una venta pasada queda fija en el momento
 * en que se lee, con el valor vigente en el código en ese momento. Si
 * en el futuro el 15% cambia, este es el único lugar que hay que tocar.
 */
export const COMISION_PLATAFORMA = 0.15;

export type Pago = {
  id: string;
  vendedorId: string;
  monto: number;
  nota: string;
  creadoEn: Date | null;
};

function docToPago(id: string, data: DocumentData): Pago {
  return {
    id,
    vendedorId: data.vendedorId,
    monto: data.monto ?? 0,
    nota: data.nota ?? "",
    creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : null,
  };
}

/**
 * Historial de pagos que Todo Regalado ya le transfirió a este
 * vendedor. Requiere un índice compuesto (vendedorId + creadoEn) en la
 * colección `pagos` — mismo patrón que `ordenes`.
 */
export async function getPagosDeVendedor(vendedorId: string): Promise<Pago[]> {
  const ref = collection(db, "pagos");
  const q = query(
    ref,
    where("vendedorId", "==", vendedorId),
    orderBy("creadoEn", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToPago(d.id, d.data()));
}

/**
 * Registra que Todo Regalado le transfirió `monto` a un vendedor (pago
 * mensual). Las reglas de Firestore (ver firestore.rules) solo dejan
 * crear esto a una cuenta admin — este código no valida el rol por su
 * cuenta, Firestore lo rechaza igual si no corresponde.
 */
export async function registrarPago(
  vendedorId: string,
  monto: number,
  nota: string
): Promise<void> {
  const ref = collection(db, "pagos");
  await addDoc(ref, {
    vendedorId,
    monto,
    nota: nota.trim(),
    creadoEn: serverTimestamp(),
  });
}

export type ResumenCuenta = {
  bruto: number;
  comision: number;
  neto: number;
  pagado: number;
  saldoPendiente: number;
};

/**
 * A partir de las ventas con pago confirmado de un vendedor y de los
 * pagos que ya recibió, calcula el resumen de su cuenta corriente.
 * `bruto` es la suma de lo que pagaron los compradores (incluye el
 * costo de envío cuando corresponde); sobre ese total se descuenta el
 * 15% de comisión de la plataforma, y al resultado se le resta lo que
 * ya se le transfirió para saber cuánto falta pagarle.
 */
export function calcularResumenCuenta(
  ventasPagadas: { total: number }[],
  pagos: { monto: number }[]
): ResumenCuenta {
  const bruto = ventasPagadas.reduce((acc, v) => acc + v.total, 0);
  const comision = bruto * COMISION_PLATAFORMA;
  const neto = bruto - comision;
  const pagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  const saldoPendiente = neto - pagado;
  return { bruto, comision, neto, pagado, saldoPendiente };
}
