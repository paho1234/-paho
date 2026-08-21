import Header from "@/components/Header";
import {
  getProducto,
  formatARS,
  condicionLabel,
  condicionDescripcion,
  descuentoPorcentaje,
} from "@/lib/firestore";
import { notFound } from "next/navigation";
import AgregarAlCarrito from "./AgregarAlCarrito";

export const dynamic = "force-dynamic";

export default async function ProductoPage({
  params,
}: {
  params: { id: string };
}) {
  const producto = await getProducto(params.id);
  if (!producto) return notFound();

  const descuento = descuentoPorcentaje(producto);

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />

      <section className="mx-auto max-w-5xl px-5 py-10 grid md:grid-cols-2 gap-10">
        <div
          className="ficha aspect-square flex items-center justify-center border border-line relative overflow-hidden"
          style={{ backgroundColor: `${producto.imagenColor}14` }}
        >
          {producto.imagenes && producto.imagenes[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={producto.imagenes[0]}
              alt={producto.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="stamp w-16 h-16 text-lg bg-white"
              style={{ color: producto.imagenColor, borderColor: producto.imagenColor }}
            >
              {producto.categoriaLabel.slice(0, 2).toUpperCase()}
            </span>
          )}
          {descuento && (
            <span className="absolute top-4 right-4 bg-clay text-white text-sm font-bold font-mono px-3 py-1.5 rounded-sm">
              -{descuento}% OFF
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-charcoal/50 mb-2">
            Vendido por {producto.vendedor}
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight mb-4">
            {producto.titulo}
          </h1>

          <div className="flex items-baseline gap-3 mb-1">
            <p className="font-display text-4xl font-semibold text-ink">
              {formatARS(producto.precio)}
            </p>
            {producto.precioOriginal && (
              <p className="text-base text-charcoal/40 line-through">
                {formatARS(producto.precioOriginal)}
              </p>
            )}
          </div>
          {descuento && (
            <p className="text-sm text-moss font-medium mb-6">
              Ahorrás {formatARS(producto.precioOriginal! - producto.precio)}
            </p>
          )}
          {!descuento && <div className="mb-6" />}

          <div className="ficha bg-amber/10 border border-amber-dark/30 p-4 mb-6">
            <p className="text-xs font-mono uppercase tracking-wide text-amber-dark font-bold mb-1">
              {condicionLabel[producto.condicion]}
            </p>
            <p className="text-sm text-charcoal/70">
              {producto.detalleCondicion || condicionDescripcion[producto.condicion]}
            </p>
          </div>

          <p className="text-sm text-charcoal/70 mb-4">
            Stock disponible: {producto.stock} unidades
          </p>

          <div className="mb-8 space-y-1.5">
            {producto.envio.retiro && (
              <p className="text-sm text-charcoal/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                Retiro en{" "}
                {producto.envio.barrioRetiro
                  ? producto.envio.barrioRetiro
                  : "el local del vendedor"}
                {" — "}la dirección exacta se comparte después de pagar
              </p>
            )}
            {producto.envio.envioDomicilio && (
              <p className="text-sm text-charcoal/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                Envío a domicilio (AMBA) —{" "}
                {producto.envio.costoEnvio
                  ? formatARS(producto.envio.costoEnvio)
                  : "gratis"}
              </p>
            )}
          </div>

          <AgregarAlCarrito producto={producto} />
        </div>
      </section>
    </main>
  );
}
