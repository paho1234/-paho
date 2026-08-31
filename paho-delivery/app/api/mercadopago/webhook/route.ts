import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getAdminDb } from "@/lib/firebase-admin";

// Mercado Pago llama a esta URL cada vez que hay novedades sobre un
// pago (creado, actualizado). Acá es donde recién confirmamos la venta
// de verdad y descontamos stock — no antes, en crear-preferencia (ahí
// solo se ARMA la orden en estado "pendiente_pago", todavía no se sabe
// si el comprador va a llegar a pagar).
//
// Idempotencia: MP puede mandar la misma notificación más de una vez
// (reintentos, o un evento de creación + otro de actualización para el
// mismo pago). Por eso, antes de tocar stock, se chequea el estado
// actual de la orden en Firestore — si ya está "pagado", no se vuelve
// a descontar. Sin este chequeo, dos notificaciones para el mismo pago
// descontarían el stock dos veces.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const url = new URL(req.url);

    // MP manda el aviso de dos formas distintas según el momento/canal:
    // por body JSON ({ type: "payment", data: { id } }) o por query
    // string (?topic=payment&id=...). Cubrimos ambas.
    const tipo = body?.type ?? url.searchParams.get("topic");
    const paymentId = body?.data?.id ?? url.searchParams.get("id");

    if (tipo !== "payment" || !paymentId) {
      // Otros tipos de evento (merchant_order, etc.) no nos interesan
      // por ahora — respondemos 200 para que MP no siga reintentando.
      return NextResponse.json({ recibido: true });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN as string,
    });
    const payment = await new Payment(client).get({ id: paymentId });

    const ordenId = payment.external_reference;
    const estadoPago = payment.status; // "approved" | "rejected" | "pending" | "in_process" | ...

    if (!ordenId) {
      console.error("Webhook MP: pago sin external_reference", paymentId);
      return NextResponse.json({ recibido: true });
    }

    const db = getAdminDb();
    const ordenRef = db.collection("ordenes").doc(ordenId);

    if (estadoPago === "approved") {
      await db.runTransaction(async (tx) => {
        const ordenSnap = await tx.get(ordenRef);
        if (!ordenSnap.exists) return;
        const orden = ordenSnap.data()!;

        // Ya procesado por una notificación anterior — no descontar
        // stock dos veces para el mismo pago.
        if (orden.estado === "pagado") return;

        const items: { id: string; cantidad: number }[] = orden.items ?? [];
        const productoRefs = items.map((i) =>
          db.collection("productos").doc(i.id)
        );
        const productoSnaps =
          productoRefs.length > 0 ? await tx.getAll(...productoRefs) : [];

        productoSnaps.forEach((snap, idx) => {
          if (!snap.exists) return;
          const stockActual = snap.data()?.stock ?? 0;
          const nuevoStock = Math.max(0, stockActual - items[idx].cantidad);
          tx.update(productoRefs[idx], { stock: nuevoStock });
        });

        tx.update(ordenRef, { estado: "pagado" });
      });
    } else if (estadoPago === "rejected" || estadoPago === "cancelled") {
      // No se descuenta stock nunca para un pago rechazado/cancelado
      // (nunca se llegó a tocar). Solo se refleja el estado para que
      // el vendedor no vea el pedido eternamente "pendiente".
      await ordenRef.update({ estado: "cancelado" }).catch(() => {});
    }
    // "pending" / "in_process": no se toca nada, sigue como
    // "pendiente_pago" hasta la próxima notificación.

    return NextResponse.json({ recibido: true });
  } catch (err) {
    console.error("Error procesando webhook de MP:", err);
    // 200 igual: si devolvemos error, MP reintenta agresivamente y no
    // vamos a poder frenarlo hasta arreglar el bug de todos modos.
    return NextResponse.json({ recibido: true });
  }
}

// MP a veces valida la URL con un GET simple al configurarla.
export async function GET() {
  return NextResponse.json({ ok: true });
}
