"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { getCategoriasConProductos, type Categoria } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthProvider";
import { cerrarSesion } from "@/lib/auth";

export default function Header() {
  const cantidad = useCartStore((s) => s.cantidadTotal());
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const { user, rol, cargando } = useAuth();

  useEffect(() => {
    getCategoriasConProductos()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-center gap-6 py-4">
          <Link href="/" className="flex items-baseline gap-1 shrink-0">
            <span className="font-display font-black text-3xl tracking-tight">
              PAHÓ
            </span>
            <span className="stamp text-[10px] px-1.5 py-0.5 text-amber border-amber">
              OUTLET
            </span>
          </Link>

          <div className="hidden md:flex flex-1 items-center bg-paper rounded-stamp px-3 py-2 text-charcoal">
            <Search size={16} className="text-charcoal/50 shrink-0" />
            <input
              type="text"
              placeholder="Buscar productos, marcas o vendedores"
              className="w-full bg-transparent outline-none px-2 text-sm font-body"
            />
          </div>

          <div className="flex items-center gap-5 shrink-0">
            {!cargando && !user && (
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <Link href="/login" className="hover:text-amber transition-colors">
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="hover:text-amber transition-colors"
                >
                  Registrarme
                </Link>
              </div>
            )}

            {!cargando && user && (
              <div className="hidden sm:flex items-center gap-3 text-sm">
                {rol === "vendedor" && (
                  <Link
                    href="/vendedor"
                    className="hover:text-amber transition-colors"
                  >
                    Mi panel
                  </Link>
                )}
                <span className="flex items-center gap-1.5 text-paper/80">
                  <User size={15} />
                  {user.displayName ?? user.email}
                </span>
                <button
                  onClick={() => cerrarSesion()}
                  className="hover:text-amber transition-colors"
                >
                  Salir
                </button>
              </div>
            )}

            <Link
              href="/carrito"
              className="relative flex items-center gap-2 hover:text-amber transition-colors"
            >
              <ShoppingBag size={22} />
              {cantidad > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber text-ink text-[11px] font-mono font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cantidad}
                </span>
              )}
              <span className="hidden sm:inline text-sm font-medium">
                Carrito
              </span>
            </Link>
          </div>
        </div>

        <nav className="flex gap-5 overflow-x-auto pb-3 text-sm">
          {categorias.map((c) => (
            <Link
              key={c.slug}
              href={`/?categoria=${c.slug}`}
              className="whitespace-nowrap text-paper/75 hover:text-amber transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
