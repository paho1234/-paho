import Link from "next/link";
import type { Producto } from "@/lib/firestore";
import { formatARS, condicionLabel, descuentoPorcentaje } from "@/lib/firestore";

function textoEntrega(producto: Producto): string {
  const partes: string[] = [];
  if (producto.envio.retiro) {
    partes.push(
      producto.envio.barrioRetiro
        ? `Retiro en ${producto.envio.barrioRetiro}`
        : "Retiro"
    );
  }
  if (producto.envio.envioDomicilio) {
    partes.push(
      producto.envio.costoEnvio
        ? `Envío ${formatARS(producto.envio.costoEnvio)}`
        : "Envío gratis"
    );
  }
  return partes.join(" · ") || "Consultar entrega";
}

const DOS_DIAS_MS = 48 * 60 * 60 * 1000;

/**
 * Etiqueta de urgencia de la ficha. Todo sale de datos reales: el stock
 * que declaró el vendedor y la fecha de publicación. Nada inventado.
 */
function etiquetaUrgencia(
  producto: Producto
): { texto: string; clase: string } | null {
  if (producto.stock === 1)
    return { texto: "¡Última!", clase: "bg-clay text-white animate-pulse" };
  if (producto.stock <= 5)
    return { texto: "Quedan pocas", clase: "bg-clay text-white" };
  if (producto.creadoEnMs && Date.now() - producto.creadoEnMs < DOS_DIAS_MS)
    return { texto: "Recién llegó", clase: "bg-ink text-white" };
  if (producto.stock <= 10)
    return { texto: "Últimas unidades", clase: "bg-white/90 text-clay" };
  return null;
}

export default function ProductCard({ producto }: { producto: Producto }) {
  const etiqueta = etiquetaUrgencia(producto);
  const inicial = producto.categoriaLabel.slice(0, 2).toUpperCase();
  const descuento = descuentoPorcentaje(producto);

  return (
    <Link
      href={`/producto/${producto.id}`}
      className="group block bg-white border border-line rounded-stamp hover:border-ink/30 hover:shadow-md transition-all"
    >
      {/* La foto redonda es el sello distintivo de Todo Regalado — reemplaza la
          típica miniatura cuadrada de un marketplace, y hace que el
          catálogo se lea como una vidriera de "medallones" curados, no
          como una grilla genérica de e-commerce. */}
      <div
        className="relative aspect-square flex items-center justify-center p-6"
        style={{ backgroundColor: `${producto.imagenColor}10` }}
      >
        {descuento && (
          <span className="absolute top-3 right-3 z-10 bg-clay text-white text-xs font-bold font-mono px-2 py-1 rounded-sm">
            -{descuento}%
          </span>
        )}
        {etiqueta && (
          <span
            className={`absolute top-3 left-3 z-10 text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded-sm ${etiqueta.clase}`}
          >
            {etiqueta.texto}
          </span>
        )}

        <div className="relative w-[80%] aspect-square rounded-full overflow-hidden border-4 border-white shadow-[0_2px_10px_rgba(27,42,61,0.12)] bg-white flex items-center justify-center">
          {producto.imagenes && producto.imagenes[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={producto.imagenes[0]}
              alt={producto.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="font-display text-base px-3 text-center leading-tight"
              style={{ color: producto.imagenColor }}
            >
              {producto.titulo.split(" ").slice(0, 2).join(" ")}
            </span>
          )}
        </div>

        {/* El sello de categoría queda apoyado sobre el borde inferior
            del círculo, como un sello de cera sobre un medallón. */}
        <span
          className="stamp absolute bottom-4 right-[14%] w-8 h-8 text-[10px] bg-white z-10"
          style={{ color: producto.imagenColor, borderColor: producto.imagenColor }}
        >
          {inicial}
        </span>
      </div>

      <div className="p-4 pt-3">
        <p className="text-[11px] font-mono uppercase tracking-wide text-charcoal/50 mb-1">
          {producto.vendedor}
        </p>
        <h3 className="font-body text-sm font-medium leading-snug line-clamp-2 mb-1 group-hover:underline">
          {producto.titulo}
        </h3>
        <p className="text-[11px] font-mono uppercase text-moss mb-2">
          {condicionLabel[producto.condicion]}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="font-display text-xl font-semibold text-ink">
            {formatARS(producto.precio)}
          </p>
          {producto.precioOriginal && (
            <p className="text-xs text-charcoal/40 line-through">
              {formatARS(producto.precioOriginal)}
            </p>
          )}
        </div>
        <p className="text-[11px] text-charcoal/50 mt-1.5">
          {textoEntrega(producto)}
        </p>
      </div>
    </Link>
  );
}
