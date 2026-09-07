import Header from "@/components/Header";
import ComoFunciona from "@/components/ComoFunciona";
import ProductCard from "@/components/ProductCard";
import ZonaCobertura from "@/components/ZonaCobertura";
import BannerPromo from "@/components/BannerPromo";
import SeccionProductosHorizontal from "@/components/SeccionProductosHorizontal";
import { getProductos, getCategorias, descuentoPorcentaje } from "@/lib/firestore";
import { getBannerTexto } from "@/lib/config";

// El catálogo se lee de Firestore en cada request — no tiene sentido
// generarlo estático en build time.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const categoriaActiva = searchParams.categoria;
  const [lista, categorias, bannerTexto] = await Promise.all([
    getProductos(categoriaActiva),
    getCategorias(),
    getBannerTexto(),
  ]);

  const nombreCategoria = categorias.find(
    (c) => c.slug === categoriaActiva
  )?.label;

  // Las secciones de "Ofertas" y "Recién llegados" solo tienen sentido
  // mirando el catálogo completo — si el comprador ya filtró por una
  // categoría puntual, no tiene caso mostrárselas de nuevo arriba.
  // `lista` ya ES el catálogo completo cuando no hay categoría activa,
  // así que no hace falta pedirle nada más a Firestore.
  const ofertas = categoriaActiva
    ? []
    : [...lista]
        .filter((p) => descuentoPorcentaje(p) !== null)
        .sort((a, b) => (descuentoPorcentaje(b) ?? 0) - (descuentoPorcentaje(a) ?? 0))
        .slice(0, 10);

  const recienLlegados = categoriaActiva ? [] : lista.slice(0, 10);

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <BannerPromo texto={bannerTexto} />
      <ZonaCobertura />

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20 flex flex-col items-center text-center">
          <h1 className="font-display italic font-semibold text-3xl md:text-4xl text-ink">
            Todo Regalado
          </h1>
          <p className="mt-3 max-w-lg text-charcoal/70 text-base md:text-lg">
            Devoluciones, reacondicionados y liquidaciones de marcas reales,
            hasta 70% menos. Cada producto con su condición declarada, sin
            sorpresas.
          </p>
          <ComoFunciona />
        </div>
      </section>

      {ofertas.length > 0 && (
        <>
          <SeccionProductosHorizontal
            titulo="Ofertas destacadas"
            icono="%"
            productos={ofertas}
          />
          <div className="divider-torn" />
        </>
      )}

      {recienLlegados.length > 0 && (
        <>
          <SeccionProductosHorizontal
            titulo="Recién llegados"
            icono="NEW"
            productos={recienLlegados}
          />
          <div className="divider-torn" />
        </>
      )}

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
            Todo Regalado — Pushkena Textil SA · CUIT 30-71549254-3
          </p>
        </div>
      </footer>
    </main>
  );
}
