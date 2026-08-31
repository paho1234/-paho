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

  // FIX (error de hidratación #425): el carrito (Zustand + persist)
  // se recupera de localStorage del lado del cliente, pero el servidor
  // siempre renderiza con el carrito vacío. Si mostramos `cantidad`
  // directo, el primer render del cliente puede no coincidir con el
  // HTML que mandó el servidor. `mounted` arranca en false tanto en
  // servidor como en cliente (primer render idéntico) y recién pasa a
  // true después de montar, así el badge real aparece un instante
  // después sin generar mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    getCategoriasConProductos()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-paper border-b border-line">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-center gap-6 py-3">
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-header.png" alt="PAHÓ Outlet" className="h-11 w-auto" />
          </Link>

          <div className="hidden md:flex flex-1 items-center bg-white border border-line rounded-stamp px-3 py-2 text-charcoal">
            <Search size={16} className="text-charcoal/50 shrink-0" />
            <input
              type="text"
              placeholder="Buscar productos, marcas o vendedores"
              className="w-full bg-transparent outline-none px-2 text-sm font-body"
            />
          </div>

          <div className="flex items-center gap-5 shrink-0">
            {!cargando && !user && (
              <div className="hidden sm:flex items-center gap-4 text-sm text-charcoal/80">
                <Link href="/login" className="hover:text-amber-dark transition-colors">
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="hover:text-amber-dark transition-colors"
                >
                  Registrarme
                </Link>
              </div>
            )}

            {!cargando && user && (
              <div className="hidden sm:flex items-center gap-3 text-sm text-charcoal/80">
                {rol === "vendedor" && (
                  <Link
                    href="/vendedor"
                    className="hover:text-amber-dark transition-colors"
                  >
                    Mi panel
                  </Link>
                )}
                {rol === "comprador" && (
                  <Link
                    href="/mis-compras"
                    className="hover:text-amber-dark transition-colors"
                  >
                    Mis compras
                  </Link>
                )}
                {rol === "admin" && (
                  <Link
                    href="/admin"
                    className="hover:text-amber-dark transition-colors"
                  >
                    Panel admin
                  </Link>
                )}
                <span className="flex items-center gap-1.5 text-charcoal/70">
                  <User size={15} />
                  {user.displayName ?? user.email}
                </span>
                <button
                  onClick={() => cerrarSesion()}
                  className="hover:text-amber-dark transition-colors"
                >
                  Salir
                </button>
              </div>
            )}

            <Link
              href="/carrito"
              className="relative flex items-center gap-2 text-ink hover:text-amber-dark transition-colors"
            >
              <ShoppingBag size={22} />
              {mounted && cantidad > 0 && (
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
              className="whitespace-nowrap text-charcoal/60 hover:text-amber-dark transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
