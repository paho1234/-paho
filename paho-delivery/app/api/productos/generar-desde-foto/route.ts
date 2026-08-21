import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Carga rápida de productos: el vendedor saca una foto y esto le arma un
// borrador de la publicación (título, categoría, condición sugerida y su
// descripción) para que solo tenga que revisar y poner el precio. Corre
// en el servidor porque necesita la API key de Anthropic — nunca se
// expone al cliente.

// Misma taxonomía que scripts/seed.mjs (estilo Mercado Libre AR, recortada
// a categorías de productos físicos). Si se agrega/saca una categoría acá,
// hacer el mismo cambio allá.
const CATEGORIAS_VALIDAS = [
  "accesorios-vehiculos",
  "alimentos-bebidas",
  "mascotas",
  "arte-libreria-merceria",
  "bebes",
  "belleza-cuidado-personal",
  "camaras-accesorios",
  "celulares-telefonos",
  "computacion",
  "consolas-videojuegos",
  "construccion",
  "deportes-fitness",
  "electrodomesticos",
  "electronica-audio-video",
  "herramientas",
  "hogar-muebles-jardin",
  "instrumentos-musicales",
  "joyas-relojes",
  "juegos-juguetes",
  "libros-revistas-comics",
  "musica-peliculas-series",
  "ropa-accesorios",
  "salud-equipamiento-medico",
] as const;

const CONDICIONES_VALIDAS = [
  "devolucion_sin_uso",
  "reacondicionado",
  "detalle_estetico",
  "caja_abierta",
] as const;

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function POST(req: NextRequest) {
  try {
    const { imagenBase64, mediaType } = (await req.json()) as {
      imagenBase64: string;
      mediaType: MediaType;
    };

    if (!imagenBase64) {
      return NextResponse.json(
        { error: "Falta la imagen" },
        { status: 400 }
      );
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Falta configurar ANTHROPIC_API_KEY en el servidor para usar la generación con IA.",
        },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Sos un asistente que ayuda a vendedores de un outlet de
devoluciones/liquidaciones (Argentina) a publicar productos rápido a
partir de una foto.

Mirá la foto y devolvé SOLO un JSON (sin texto extra, sin markdown) con
esta forma exacta:

{
  "titulo": "string corto y descriptivo, estilo marketplace, en español rioplatense",
  "categoria": "una de: ${CATEGORIAS_VALIDAS.join(", ")}",
  "condicionSugerida": "una de: ${CONDICIONES_VALIDAS.join(", ")}",
  "detalleCondicionSugerido": "1-2 oraciones describiendo lo que se ve en la foto que justifica esa condición (ej: rasguños, caja abierta, etc). Si no se ve ningún defecto, decí que aparenta estar en buen estado y que el vendedor debe confirmar el motivo de la devolución.",
  "confianza": "alta" | "media" | "baja"
}

Importante: esto es una SUGERENCIA que el vendedor va a revisar y
corregir antes de publicar — no inventes defectos que no se ven, y si la
imagen no es clara, marcá confianza "baja".`;

    const respuesta = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imagenBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const bloqueTexto = respuesta.content.find((b) => b.type === "text");
    if (!bloqueTexto || bloqueTexto.type !== "text") {
      throw new Error("Respuesta vacía del modelo");
    }

    const limpio = bloqueTexto.text.replace(/```json|```/g, "").trim();
    const sugerencia = JSON.parse(limpio);

    if (!CATEGORIAS_VALIDAS.includes(sugerencia.categoria)) {
      sugerencia.categoria = "hogar-muebles-jardin";
    }
    if (!CONDICIONES_VALIDAS.includes(sugerencia.condicionSugerida)) {
      sugerencia.condicionSugerida = "devolucion_sin_uso";
    }

    return NextResponse.json(sugerencia);
  } catch (err) {
    console.error("Error generando sugerencia desde foto:", err);
    return NextResponse.json(
      { error: "No pudimos generar la sugerencia. Cargá los datos a mano." },
      { status: 500 }
    );
  }
}
