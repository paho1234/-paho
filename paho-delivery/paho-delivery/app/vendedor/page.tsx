"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthProvider";
import { getProductosDeVendedor } from "@/lib/productos-vendedor";
import { getPerfilVendedor } from "@/lib/auth";
import { formatARS, type Producto } from "@/lib/firestore";
import { Plus, Tag, Package, Settings, Wallet } from "lucide-react";

export default function VendedorPage() {
  const { user, rol, cargando } = useAuth();
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  // null = todavía cargando el perfil; no mostramos el aviso hasta saberlo,
  // para que un vendedor ya aprobado no vea parpadear el cartel.
  const [verificado, setVerificado] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || rol !== "vendedor") return;
    getPerfilVendedor(user.uid)
      .then((p) => setVerificado(p?.verificado ?? false))
      .catch(() => setVerificado(null));
  }, [user, rol]);

  useEffect(() => {
    if (cargando) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (rol !== "vendedor") {
      router.push("/");
    }
  }, [user, rol, cargando, router]);

  useEffect(() => {
    if (!user || rol !== "vendedor") return;
    getProductosDeVendedor(user.uid)
      .then(setProductos)
      .finally(() => setCargandoProductos(false));
  }, [user, rol]);

  if (cargando || !user || rol !== "vendedor") {
    return (
      <main className="min-h-screen bg-paper-texture">
        <Header />
        <p className="text-center text-sm text-charcoal/50 py-24">
          Cargando…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <h1 className="font-display text-3xl font-semibold">
            Panel de vendedor
          </h1>
          <div className="flex items-center flex-wrap gap-2">
            <Link
              href="/vendedor/perfil"
              className="flex items-center gap-1.5 border border-line text-ink font-semibold px-4 py-2 rounded-stamp text-sm hover:border-ink/40 transition-colors"
            >
              <Settings size={16} />
              Mi perfil
            </Link>
            <Link
              href="/vendedor/pedidos"
              className="flex items-center gap-1.5 border border-line text-ink font-semibold px-4 py-2 rounded-stamp text-sm hover:border-ink/40 transition-colors"
            >
              <Package size={16} />
              Mis pedidos
            </Link>
            <Link
              href="/vendedor/cuenta"
              className="flex items-center gap-1.5 border border-line text-ink font-semibold px-4 py-2 rounded-stamp text-sm hover:border-ink/40 transition-colors"
            >
              <Wallet size={16} />
              Estado de cuenta
            </Link>
            <Link
              href="/vendedor/productos/nuevo"
              className="flex items-center gap-1.5 bg-ink text-white font-semibold px-4 py-2 rounded-stamp text-sm hover:bg-ink-light transition-colors"
            >
              <Plus size={16} />
              Publicar producto
            </Link>
          </div>
        </div>
        <p className="text-charcoal/60 text-sm mb-6">
          Hola, {user.displayName}.
        </p>

        {verificado === false && (
          <div className="ficha bg-white border border-amber-dark/40 p-4 mb-8 text-sm">
            <p className="font-medium mb-1">Tu cuenta está en revisión</p>
            <p className="text-charcoal/70">
              Nuestro equipo está validando tus datos de facturación. Apenas
              te aprobemos vas a poder publicar productos. Mientras tanto,
              podés completar tu perfil.
            </p>
          </div>
        )}

        <h2 className="font-display text-xl font-semibold mb-4">
          Mis productos
        </h2>

        {cargandoProductos ? (
          <p className="text-sm text-charcoal/50">Cargando…</p>
        ) : productos.length === 0 ? (
          <div className="ficha bg-white border border-line p-8 text-center text-sm text-charcoal/60">
            Todavía no publicaste ningún producto.{" "}
            <Link
              href="/vendedor/productos/nuevo"
              className="text-ink font-medium underline"
            >
              Publicá el primero
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-2">
            {productos.map((p) => (
              <div
                key={p.id}
                className="ficha flex items-center gap-4 bg-white border border-line p-3"
              >
                <div
                  className="w-14 h-14 rounded-stamp shrink-0"
                  style={{ backgroundColor: `${p.imagenColor}22` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.titulo}</p>
                  <p className="text-xs text-charcoal/50">
                    Stock: {p.stock} · {p.categoriaLabel}
                  </p>
                </div>
                <p className="font-display font-semibold text-ink shrink-0">
                  {formatARS(p.precio)}
                </p>
                <Link
                  href={`/vendedor/productos/${p.id}/etiqueta`}
                  className="flex items-center gap-1 text-xs text-ink border border-line rounded-stamp px-2.5 py-1.5 hover:border-ink/40 transition-colors shrink-0"
                  title="Ver/imprimir etiqueta con código de barras"
                >
                  <Tag size={13} />
                  Etiqueta
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
