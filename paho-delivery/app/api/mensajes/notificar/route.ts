import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { notificarMensajeNuevo } from "@/lib/email";

/**
 * El chat de mensajes vive enteramente en el cliente (Firestore SDK
 * directo, ver lib/mensajes.ts) porque no necesita lógica de servidor
 * para guardar el mensaje — las reglas de Firestore ya lo protegen. Pero
 * mandar el email de aviso SÍ necesita el servidor, porque RESEND_API_KEY
 * es una clave privada que nunca debe llegar al navegador. Por eso el
 * cliente, después de guardar el mensaje con éxito, llama a esta ruta
 * nada más que para disparar el mail — si esta llamada falla, el
 * mensaje ya quedó guardado igual, no se pierde nada.
 *
 * Se valida con el Admin SDK que `autorId` sea realmente parte de esa
 * orden (comprador o vendedor), para que no se pueda usar esta ruta
 * para mandar mails de spam a cualquier email a partir de un ordenId
 * ajeno.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const ordenId = body?.ordenId;
    const autorId = body?.autorId;
    const autorRol = body?.autorRol;
    const texto = body?.texto;

    if (
      typeof ordenId !== "string" ||
      typeof autorId !== "string" ||
      (autorRol !== "comprador" && autorRol !== "vendedor") ||
      typeof texto !== "string" ||
      !texto.trim()
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const db = getAdminDb();
    const ordenSnap = await db.collection("ordenes").doc(ordenId).get();
    if (!ordenSnap.exists) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    const orden = ordenSnap.data()!;

    const esComprador = autorRol === "comprador" && orden.compradorId === autorId;
    const esVendedor = autorRol === "vendedor" && orden.vendedorId === autorId;
    if (!esComprador && !esVendedor) {
      // No es quien dice ser — no mandamos nada.
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    // El destinatario es SIEMPRE la otra parte de la orden, nunca quien
    // escribió el mensaje.
    const emailDestino = esComprador
      ? (await db.collection("vendedores").doc(orden.vendedorId).get()).data()?.email
      : (await db.collection("usuarios").doc(orden.compradorId).get()).data()?.email;

    if (emailDestino) {
      await notificarMensajeNuevo({
        email: emailDestino,
        ordenId,
        rolRemitente: autorRol,
        texto,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error notificando mensaje nuevo:", err);
    // 200 igual: esto es un aviso de mejor esfuerzo, nunca debe hacer
    // que el chat parezca roto del lado del cliente.
    return NextResponse.json({ ok: false });
  }
}
