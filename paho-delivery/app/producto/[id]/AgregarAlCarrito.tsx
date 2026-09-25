"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import type { Producto } from "@/lib/firestore";

export default function AgregarAlCarrito({ producto }: { producto: Producto }) {
  const [agregado, setAgregado] = useState(false);
  const agregar = useCartStore((s) => s.agregar);
  const cantidadEnCarrito = useCartStore(
    (s) => s.items.find((i) => i.id === producto.id)?.cantidad ?? 0
  );
  const router = useRouter();

  const sinStock = producto.stock <= 0;
  const alMaximo = !sinStock && cantidadEnCarrito >= producto.stock;

  if (sinStock) {
    return (
      <div className="inline-flex items-center gap-2 bg-line text-charcoal/50 px-6 py-3 rounded-stamp font-medium text-sm">
        Sin stock disponible
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (alMaximo) return;
            agregar(producto);
            setAgregado(true);
            setTimeout(() => setAgregado(false), 1500);
          }}
          disabled={alMaximo}
          className="bg-ink text-paper px-6 py-3 rounded-stamp font-medium text-sm hover:bg-ink-light transition-colors disabled:opacity-50 disabled:hover:bg-ink disabled:cursor-not-allowed"
        >
          {agregado ? "Agregado ✓" : "Agregar al carrito"}
        </button>
        <button
          onClick={() => {
            if (!alMaximo) agregar(producto);
            router.push("/carrito");
          }}
          disabled={alMaximo && cantidadEnCarrito === 0}
          className="border border-ink px-6 py-3 rounded-stamp font-medium text-sm hover:bg-ink hover:text-paper transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Comprar ahora
        </button>
      </div>
      {alMaximo && (
        <p className="text-xs text-charcoal/50 mt-2">
          Ya tenés en tu carrito todo el stock disponible de este producto.
        </p>
      )}
    </div>
  );
}
