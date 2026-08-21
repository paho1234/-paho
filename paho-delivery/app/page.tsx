import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { getProductos, getCategorias } from "@/lib/firestore";

// El catálogo se lee de Firestore en cada request — no tiene sentido
// generarlo estático en build time.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const categoriaActiva = searchParams.categoria;
  const [lista, categorias] = await Promise.all([
    getProductos(categoriaActiva),
    getCategorias(),
  ]);

  const nombreCategoria = categorias.find(
    (c) => c.slug === categoriaActiva
  )?.label;

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <span className="stamp text-xs px-2 py-1 text-clay border-clay mb-5">
            OUTLET DE DEVOLUCIONES
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.05] max-w-2xl">
            Productos como nuevos,{" "}
            <span className="italic text-amber-dark">a precio de devolución.</span>
          </h1>
          <p className="mt-5 max-w-lg text-charcoal/70 text-base md:text-lg">
            Devoluciones, reacondicionados y liquidaciones de marcas reales,
            hasta 70% menos. Cada producto con su condición declarada, sin
            sorpresas.
          </p>
        </div>
      </section>

      <div className="divider-torn" />

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold">
            {nombreCategoria ?? "Todo el catálogo"}
          </h2>
          <span className="font-mono text-xs text-charcoal/50">
            {lista.length} publicaciones
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {lista.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>

        {lista.length === 0 && (
          <p className="text-charcoal/60 text-sm py-10 text-center">
            Todavía no hay publicaciones en esta categoría.
          </p>
        )}
      </section>

      <footer className="border-t border-line mt-10 py-8">
        <div className="mx-auto max-w-6xl px-5 space-y-2">
          <p className="text-xs text-charcoal/50 max-w-2xl">
            Todos los productos publicados declaran su condición real
            (devolución sin uso, reacondicionado, con detalle estético o
            caja abierta), conforme a la Ley de Defensa del Consumidor.
          </p>
          <p className="text-xs text-charcoal/50 font-mono">
            PAHÓ — Pushkena Textil SA · CUIT 30-71549254-3
          </p>
        </div>
      </footer>
    </main>
  );
}
