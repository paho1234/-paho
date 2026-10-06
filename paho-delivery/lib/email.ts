import { Resend } from "resend";
import type { ItemOrden, Envio } from "@/lib/ordenes";

// Si todavía no se configuró RESEND_API_KEY (por ejemplo, recién
// desplegando esto por primera vez), no tiene sentido tirar error y
// romper el webhook de Mercado Pago por un mail que no se pudo mandar
// — el pago y el descuento de stock son lo importante, el mail es un
// plus. Por eso cada función de este archivo es "silenciosa": si algo
// falla, loguea el error y sigue, nunca lanza una excepción hacia quien
// la llama.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Mientras el dominio todoregalado.com no esté verificado en Resend,
// hay que mandar desde esta dirección de prueba (onboarding@resend.dev)
// — Resend no deja usar un dominio propio sin verificar. Una vez
// verificado, se puede definir EMAIL_FROM en Netlify con algo como
// "Todo Regalado <notificaciones@todoregalado.com>" y este archivo lo
// usa automáticamente, sin tocar código.
const FROM = process.env.EMAIL_FROM ?? "Todo Regalado <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://todoregalado.com";

// El texto del mensaje lo escribe cualquier usuario, así que antes de
// insertarlo en el HTML del mail hay que escapar los caracteres que
// podrían romper el markup o inyectar HTML propio.
function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listaItemsHtml(items: ItemOrden[]) {
  return items
    .map(
      (i) =>
        `<li>${i.titulo} × ${i.cantidad}</li>`
    )
    .join("");
}

function formatARS(valor: number) {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

async function enviar(params: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY no está configurada — no se mandó el mail:",
      params.subject
    );
    return;
  }
  try {
    await resend.emails.send({ from: FROM, ...params });
  } catch (err) {
    // No relanzamos el error: un mail que falla no debe tirar abajo el
    // webhook ni la venta, que ya se procesó bien en Firestore.
    console.error("Error enviando mail:", params.subject, err);
  }
}

export async function notificarVentaAlVendedor(datos: {
  emailVendedor: string;
  items: ItemOrden[];
  total: number;
  envio: Envio;
}) {
  await enviar({
    to: datos.emailVendedor,
    subject: "¡Vendiste algo en Todo Regalado! 🎉",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto;">
        <p style="font-size: 22px; font-style: italic; font-weight: 600; color: #1B2A3D;">Todo Regalado</p>
        <p>¡Tenés una venta nueva! Esto es lo que se vendió:</p>
        <ul>${listaItemsHtml(datos.items)}</ul>
        <p><strong>Total: ${formatARS(datos.total)}</strong></p>
        <p>${
          datos.envio.metodo === "domicilio"
            ? "Es con envío a domicilio — coordiná el despacho."
            : "Es con retiro en el local — el comprador va a pasar a buscarlo."
        }</p>
        <p><a href="${SITE_URL}/vendedor/pedidos" style="color: #1B2A3D;">Ver el pedido completo →</a></p>
      </div>
    `,
  });
}

/**
 * Aviso de que llegó un mensaje nuevo en el chat de un pedido. `rolRemitente`
 * es quién escribió (para el asunto/cuerpo, desde el punto de vista de
 * quien LO RECIBE): si escribió el vendedor, el aviso es para el
 * comprador, y viceversa. El link manda a la página de mensajes que le
 * corresponde a cada rol (son rutas distintas — ver app/mis-compras y
 * app/vendedor/pedidos).
 */
export async function notificarMensajeNuevo(datos: {
  email: string;
  ordenId: string;
  rolRemitente: "comprador" | "vendedor";
  texto: string;
}) {
  const esParaVendedor = datos.rolRemitente === "comprador";
  const url = esParaVendedor
    ? `${SITE_URL}/vendedor/pedidos/${datos.ordenId}/mensajes`
    : `${SITE_URL}/mis-compras/${datos.ordenId}/mensajes`;
  const quienEscribe = esParaVendedor ? "el comprador" : "el vendedor";

  await enviar({
    to: datos.email,
    subject: "Tenés un mensaje nuevo en Todo Regalado 💬",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto;">
        <p style="font-size: 22px; font-style: italic; font-weight: 600; color: #1B2A3D;">Todo Regalado</p>
        <p>Te escribió ${quienEscribe} sobre un pedido:</p>
        <p style="background: #f5f5f5; border-radius: 8px; padding: 12px 16px; color: #333;">
          "${escapeHtml(datos.texto.length > 200 ? datos.texto.slice(0, 200) + "…" : datos.texto)}"
        </p>
        <p><a href="${url}" style="color: #1B2A3D;">Responder →</a></p>
      </div>
    `,
  });
}

export async function notificarCompraAlComprador(datos: {
  emailComprador: string;
  items: ItemOrden[];
  total: number;
  envio: Envio;
}) {
  await enviar({
    to: datos.emailComprador,
    subject: "Tu compra en Todo Regalado está confirmada ✅",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto;">
        <p style="font-size: 22px; font-style: italic; font-weight: 600; color: #1B2A3D;">Todo Regalado</p>
        <p>¡Gracias por tu compra! Ya confirmamos tu pago.</p>
        <ul>${listaItemsHtml(datos.items)}</ul>
        <p><strong>Total: ${formatARS(datos.total)}</strong></p>
        <p>${
          datos.envio.metodo === "domicilio"
            ? "El vendedor te lo va a enviar a domicilio."
            : "Vas a poder retirarlo en el local acordado."
        }</p>
        <p><a href="${SITE_URL}/mis-compras" style="color: #1B2A3D;">Ver el estado de tu compra →</a></p>
      </div>
    `,
  });
}
