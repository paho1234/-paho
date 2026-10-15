import Header from "@/components/Header";
import ComoFunciona from "@/components/ComoFunciona";
import ProductCard from "@/components/ProductCard";
import ZonaCobertura from "@/components/ZonaCobertura";
import BannerPromo from "@/components/BannerPromo";
import HeroUrgencia from "@/components/HeroUrgencia";
import CintaUrgencia from "@/components/CintaUrgencia";
import SeccionProductosHorizontal from "@/components/SeccionProductosHorizontal";
import { getProductos, getCategorias } from "@/lib/firestore";
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

  // Números reales del catálogo para la portada y la sección de urgencia.
  const ahora = Date.now();
  const nuevas48h = lista.filter(
    (p) => p.creadoEnMs && ahora - p.creadoEnMs < 48 * 60 * 60 * 1000
  ).length;
  const ultimasUnidades = categoriaActiva
    ? []
    : lista.filter((p) => p.stock <= 3).slice(0, 12);

  const nombreCategoria = categorias.find(
    (c) => c.slug === categoriaActiva
  )?.label;

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <BannerPromo texto={bannerTexto} />
      <HeroUrgencia
        publicaciones={lista.length}
        nuevas48h={nuevas48h}
      />
      <CintaUrgencia />
      <ZonaCobertura />

      <SeccionProductosHorizontal
        titulo="Últimas unidades — no se reponen"
        icono="!"
        productos={ultimasUnidades}
      />

      <div className="divider-torn" />

      <section id="catalogo" className="mx-auto max-w-6xl px-5 py-10 scroll-mt-4">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold">
            {nombreCategoria ?? "Recién llegados"}
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

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-12 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Así de rápido es comprar
          </h2>
          <ComoFunciona />
        </div>
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
