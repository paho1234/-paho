import type { Producto } from "@/lib/firestore";
import ProductCard from "@/components/ProductCard";

export default function SeccionProductosHorizontal({
  titulo,
  icono,
  productos,
}: {
  titulo: string;
  icono?: string;
  productos: Producto[];
}) {
  if (productos.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex items-baseline gap-2 mb-4">
        {icono && (
          <span className="stamp w-7 h-7 text-[10px] text-clay border-clay bg-white shrink-0">
            {icono}
          </span>
        )}
        <h2 className="font-display text-xl font-semibold">{titulo}</h2>
      </div>

      {/* Scroll horizontal tipo "mesa de feria": cada ficha con ancho fijo,
          snap para que quede prolijo al soltar el swipe en mobile. */}
      <div
        className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory"
        style={{ scrollbarWidth: "thin" }}
      >
        {productos.map((producto) => (
          <div
            key={producto.id}
            className="w-[160px] sm:w-[200px] shrink-0 snap-start"
          >
            <ProductCard producto={producto} />
          </div>
        ))}
      </div>
    </section>
  );
}
