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

function formatARS(valor: number) {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

// ---------------------------------------------------------------------
// Diseño de los mails. Todos comparten el mismo marco (layout): encabezado
// con la marca, tarjeta blanca, botón y pie. Se usa HTML con tablas y
// estilos en línea porque es lo único que renderizan bien Outlook, Gmail
// y los clientes móviles (no soportan CSS externo ni flexbox).
// ---------------------------------------------------------------------
const COLOR_MARCA = "#5C1417"; // bordó de la marca
const COLOR_ACENTO = "#E33A2E";
const COLOR_FONDO = "#F6F3EF";
const COLOR_TEXTO = "#1A1A1A";
const COLOR_SUAVE = "#6B6B6B";
const FUENTE = "Helvetica, Arial, sans-serif";

function boton(texto: string, url: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0 4px;">
      <tr>
        <td style="background: ${COLOR_MARCA}; border-radius: 8px;">
          <a href="${url}" style="display: inline-block; padding: 14px 28px; font-family: ${FUENTE}; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none;">${texto}</a>
        </td>
      </tr>
    </table>`;
}

function layout(params: {
  preheader: string;
  titulo: string;
  contenido: string;
  nota?: string;
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${params.titulo}</title>
</head>
<body style="margin: 0; padding: 0; background: ${COLOR_FONDO};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${params.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${COLOR_FONDO};">
    <tr>
      <td align="center" style="padding: 28px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
          <tr>
            <td align="center" style="background: #060201; border-radius: 12px 12px 0 0; padding: 22px 16px 14px;">
              <a href="${SITE_URL}" style="text-decoration: none;">
                <img src="${SITE_URL}/logo-email.png" width="200" alt="Todo Regalado" style="display: block; width: 200px; max-width: 100%; height: auto; border: 0; font-family: Georgia, serif; font-size: 24px; font-style: italic; font-weight: bold; color: #ffffff;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; border-radius: 0 0 12px 12px; border-top: 4px solid ${COLOR_ACENTO}; padding: 32px 28px; font-family: ${FUENTE}; color: ${COLOR_TEXTO}; font-size: 15px; line-height: 1.55;">
              <h1 style="margin: 0 0 14px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; line-height: 1.25; color: ${COLOR_MARCA};">${params.titulo}</h1>
              ${params.contenido}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 16px 0; font-family: ${FUENTE}; font-size: 12px; line-height: 1.5; color: ${COLOR_SUAVE};">
              ${params.nota ? `${params.nota}<br><br>` : ""}
              Este aviso lo enviamos automáticamente desde <a href="${SITE_URL}" style="color: ${COLOR_SUAVE};">todoregalado.com</a>.<br>
              Si no esperabas este mail, podés ignorarlo.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function tablaItems(items: ItemOrden[], total: number) {
  const filas = items
    .map(
      (i) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #EAEAEA; font-size: 14px;">${escapeHtml(i.titulo)}</td>
          <td align="right" style="padding: 10px 0 10px 12px; border-bottom: 1px solid #EAEAEA; font-size: 14px; color: ${COLOR_SUAVE}; white-space: nowrap;">× ${i.cantidad}</td>
        </tr>`
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 0;">
      ${filas}
      <tr>
        <td style="padding: 14px 0 0; font-size: 14px; font-weight: bold;">Total</td>
        <td align="right" style="padding: 14px 0 0; font-size: 18px; font-weight: bold; color: ${COLOR_MARCA}; white-space: nowrap;">${formatARS(total)}</td>
      </tr>
    </table>`;
}

function cajaAviso(texto: string) {
  return `<p style="margin: 20px 0 0; padding: 12px 14px; background: #FBF3E4; border-left: 3px solid #E8A33D; border-radius: 4px; font-size: 14px;">${texto}</p>`;
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
    html: layout({
      preheader: `Nueva venta por ${formatARS(datos.total)}. Entrá a ver el pedido.`,
      titulo: "¡Tenés una venta nueva! 🎉",
      contenido: `
        <p style="margin: 0;">Ya confirmamos el pago. Esto es lo que se vendió:</p>
        ${tablaItems(datos.items, datos.total)}
        ${cajaAviso(
          datos.envio.metodo === "domicilio"
            ? "<strong>Envío a domicilio:</strong> coordiná el despacho y marcá el pedido como despachado desde tu panel."
            : "<strong>Retiro en el local:</strong> el comprador va a pasar a buscarlo. Marcalo como entregado cuando lo retire."
        )}
        ${boton("Ver el pedido", `${SITE_URL}/vendedor/pedidos`)}
      `,
    }),
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
  const quienEscribe = esParaVendedor ? "El comprador" : "El vendedor";
  const recorte =
    datos.texto.length > 200 ? datos.texto.slice(0, 200) + "…" : datos.texto;

  await enviar({
    to: datos.email,
    subject: "Tenés un mensaje nuevo en Todo Regalado 💬",
    html: layout({
      preheader: `${quienEscribe} te escribió sobre un pedido.`,
      titulo: "Tenés un mensaje nuevo 💬",
      contenido: `
        <p style="margin: 0;">${quienEscribe} te escribió sobre un pedido:</p>
        <p style="margin: 16px 0 0; padding: 14px 16px; background: #F6F3EF; border-left: 3px solid ${COLOR_ACENTO}; border-radius: 4px; font-size: 15px; color: #333; white-space: pre-wrap;">${escapeHtml(recorte)}</p>
        ${boton("Responder", url)}
      `,
      nota: "💡 Si este mail te llegó a la carpeta de spam, marcalo como “No es spam” para recibir los próximos en tu bandeja principal.",
    }),
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
    html: layout({
      preheader: `Confirmamos tu pago de ${formatARS(datos.total)}.`,
      titulo: "¡Gracias por tu compra! ✅",
      contenido: `
        <p style="margin: 0;">Ya confirmamos tu pago. Este es el resumen:</p>
        ${tablaItems(datos.items, datos.total)}
        ${cajaAviso(
          datos.envio.metodo === "domicilio"
            ? "<strong>Envío a domicilio:</strong> el vendedor te lo va a enviar. Podés escribirle desde tu compra."
            : "<strong>Retiro en el local:</strong> vas a poder retirarlo en el local acordado. La dirección exacta la ves en tu compra."
        )}
        ${boton("Ver mi compra", `${SITE_URL}/mis-compras`)}
      `,
      nota: "💡 Si este mail te llegó a spam, marcalo como “No es spam” para recibir los avisos de tu pedido.",
    }),
  });
}
