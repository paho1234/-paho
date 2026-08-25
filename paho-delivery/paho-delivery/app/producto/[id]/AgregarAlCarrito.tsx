"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import type { Producto } from "@/lib/firestore";

export default function AgregarAlCarrito({ producto }: { producto: Producto }) {
  const [agregado, setAgregado] = useState(false);
  const agregar = useCartStore((s) => s.agregar);
  const router = useRouter();

  return (
    <div className="flex gap-3">
      <button
        onClick={() => {
          agregar(producto);
          setAgregado(true);
          setTimeout(() => setAgregado(false), 1500);
        }}
        className="bg-ink text-paper px-6 py-3 rounded-stamp font-medium text-sm hover:bg-ink-light transition-colors"
      >
        {agregado ? "Agregado ✓" : "Agregar al carrito"}
      </button>
      <button
        onClick={() => {
          agregar(producto);
          router.push("/carrito");
        }}
        className="border border-ink px-6 py-3 rounded-stamp font-medium text-sm hover:bg-ink hover:text-paper transition-colors"
      >
        Comprar ahora
      </button>
    </div>
  );
}
