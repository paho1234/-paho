"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthProvider";
import { getBannerTexto, setBannerTexto } from "@/lib/config";
import {
  getTodosLosProductosAdmin,
  borrarProductoAdmin,
  getTodasLasVentasAdmin,
  getTodosLosVendedoresAdmin,
  borrarVendedorAdmin,
  type VentaAdmin,
  type VendedorAdmin,
} from "@/lib/admin";
import { formatARS, condicionLabel, type Producto } from "@/lib/firestore";
import { Trash2, Save, ShieldCheck } from "lucide-react";

const estadoVentaLabel: Record<VentaAdmin["estado"], string> = {
  pendiente_pago: "Pago pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

const estadoVentaColor: Record<VentaAdmin["estado"], string> = {
  pendiente_pago: "text-amber-dark",
  pagado: "text-moss",
  cancelado: "text-clay",
};

export default function AdminPage() {
  const { user, rol, cargando } = useAuth();
  const router = useRouter();

  const [bannerTexto, setBannerTextoLocal] = useState("");
  const [bannerCargando, setBannerCargando] = useState(true);
  const [bannerGuardando, setBannerGuardando] = useState(false);
  const [bannerMensaje, setBannerMensaje] = useState<string | null>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosCargando, setProductosCargando] = useState(true);
  const [borrandoProducto, setBorrandoProducto] = useState<string | null>(null);

  const [ventas, setVentas] = useState<VentaAdmin[]>([]);
  const [ventasCargando, setVentasCargando] = useState(true);

  const [vendedores, setVendedores] = useState<VendedorAdmin[]>([]);
  const [vendedoresCargando, setVendedoresCargando] = useState(true);
  const [borrandoVendedor, setBorrandoVendedor] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cargando) return;
    if (!user || rol !== "admin") {
      router.push("/");
    }
  }, [user, rol, cargando, router]);

  useEffect(() => {
    if (!user || rol !== "admin") return;
    getBannerTexto()
      .then(setBannerTextoLocal)
      .finally(() => setBannerCargando(false));
    getTodosLosProductosAdmin()
      .then(setProductos)
      .catch(() => setError("No pudimos cargar los productos."))
      .finally(() => setProductosCargando(false));
    getTodasLasVentasAdmin()
      .then(setVentas)
      .catch(() => setError("No pudimos cargar las ventas."))
      .finally(() => setVentasCargando(false));
    getTodosLosVendedoresAdmin()
      .then(setVendedores)
      .catch(() => setError("No pudimos cargar los vendedores."))
      .finally(() => setVendedoresCargando(false));
  }, [user, rol]);

  // Nombre de vendedor a partir de su id, para mostrar en la lista de
  // ventas (la orden solo guarda vendedorId, no el nombre de fantasía).
  const nombreVendedor = (vendedorId: string) =>
    vendedores.find((v) => v.id === vendedorId)?.nombreEmpresa ?? vendedorId;

  async function handleGuardarBanner() {
    setBannerGuardando(true);
    setBannerMensaje(null);
    try {
      await setBannerTexto(bannerTexto);
      setBannerMensaje("Banner actualizado.");
    } catch {
      setBannerMensaje("No se pudo guardar. Probá de nuevo.");
    } finally {
      setBannerGuardando(false);
    }
  }

  async function handleBorrarProducto(producto: Producto) {
    const confirmado = window.confirm(
      `¿Eliminar "${producto.titulo}" (vendedor: ${producto.vendedor})? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setBorrandoProducto(producto.id);
    try {
      await borrarProductoAdmin(producto.id);
      setProductos((prev) => prev.filter((p) => p.id !== producto.id));
    } catch {
      setError(
        `No se pudo eliminar "${producto.titulo}". Probá de nuevo.`
      );
    } finally {
      setBorrandoProducto(null);
    }
  }

  async function handleBorrarVendedor(vendedor: VendedorAdmin) {
    const confirmado = window.confirm(
      `¿Eliminar el perfil de "${vendedor.nombreEmpresa}"? No borra sus publicaciones (hacelo aparte si querés) ni su cuenta de acceso — pero no va a poder operar hasta que se registre de nuevo. Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setBorrandoVendedor(vendedor.id);
    try {
      await borrarVendedorAdmin(vendedor.id);
      setVendedores((prev) => prev.filter((v) => v.id !== vendedor.id));
    } catch {
      setError(`No se pudo eliminar el perfil de "${vendedor.nombreEmpresa}". Probá de nuevo.`);
    } finally {
      setBorrandoVendedor(null);
    }
  }

  if (cargando || !user || rol !== "admin") {
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
      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={22} className="text-moss" />
          <h1 className="font-display text-3xl font-semibold">
            Panel admin
          </h1>
        </div>
        <p className="text-charcoal/60 text-sm mb-10">
          Editá el banner del home y moderá publicaciones de cualquier
          vendedor.
        </p>

        {/* --- Banner --- */}
        <div className="ficha bg-white border border-line p-5 mb-10">
          <h2 className="font-display text-lg font-semibold mb-3">
            Banner promocional del home
          </h2>
          {bannerCargando ? (
            <p className="text-sm text-charcoal/50">Cargando…</p>
          ) : (
            <>
              <textarea
                value={bannerTexto}
                onChange={(e) => setBannerTextoLocal(e.target.value)}
                rows={2}
                maxLength={200}
                className="w-full border border-line rounded-stamp p-3 text-sm font-mono outline-none focus:border-ink/40"
                placeholder="Texto que aparece en la franja arriba del hero del home…"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleGuardarBanner}
                  disabled={bannerGuardando}
                  className="inline-flex items-center gap-1.5 text-sm bg-ink text-white font-medium rounded-stamp px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <Save size={14} />
                  {bannerGuardando ? "Guardando…" : "Guardar banner"}
                </button>
                {bannerMensaje && (
                  <span className="text-xs text-charcoal/60">
                    {bannerMensaje}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* --- Productos --- */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">
              Todas las publicaciones
            </h2>
            <span className="font-mono text-xs text-charcoal/50">
              {productos.length} productos
            </span>
          </div>

          {error && <p className="text-sm text-clay mb-3">{error}</p>}

          {productosCargando ? (
            <p className="text-sm text-charcoal/50">Cargando…</p>
          ) : productos.length === 0 ? (
            <div className="ficha bg-white border border-line p-8 text-center text-sm text-charcoal/60">
              Todavía no hay publicaciones en el catálogo.
            </div>
          ) : (
            <div className="space-y-2">
              {productos.map((p) => (
                <div
                  key={p.id}
                  className="ficha bg-white border border-line p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {p.titulo}
                      </p>
                      {!p.activo && (
                        <span className="shrink-0 text-[10px] font-mono uppercase text-charcoal/50 bg-line px-1.5 py-0.5 rounded-sm">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono uppercase text-charcoal/50 mt-0.5">
                      {p.vendedor} · {condicionLabel[p.condicion]}
                    </p>
                    <Link
                      href={`/producto/${p.id}`}
                      className="text-[11px] text-ink underline"
                    >
                      Ver publicación
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <p className="font-display font-semibold text-ink text-sm">
                      {formatARS(p.precio)}
                    </p>
                    <button
                      onClick={() => handleBorrarProducto(p)}
                      disabled={borrandoProducto === p.id}
                      className="inline-flex items-center gap-1.5 text-xs text-clay border border-clay/40 rounded-stamp px-2.5 py-1.5 hover:bg-clay hover:text-white transition-colors disabled:opacity-60"
                    >
                      <Trash2 size={13} />
                      {borrandoProducto === p.id ? "Eliminando…" : "Eliminar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* --- Ventas --- */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">
              Todas las ventas
            </h2>
            <span className="font-mono text-xs text-charcoal/50">
              {ventas.length} órdenes
            </span>
          </div>

          {ventasCargando ? (
            <p className="text-sm text-charcoal/50">Cargando…</p>
          ) : ventas.length === 0 ? (
            <div className="ficha bg-white border border-line p-8 text-center text-sm text-charcoal/60">
              Todavía no hay ventas registradas.
            </div>
          ) : (
            <div className="space-y-2">
              {ventas.map((v) => (
                <div key={v.id} className="ficha bg-white border border-line p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono uppercase text-charcoal/50">
                        {v.creadoEn
                          ? v.creadoEn.toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Fecha no disponible"}
                      </p>
                      <p className="text-sm font-medium">
                        {v.compradorNombre}
                        <span className="text-charcoal/40 font-normal">
                          {" "}
                          → {nombreVendedor(v.vendedorId)}
                        </span>
                      </p>
                      <p className="text-xs text-charcoal/60 mt-0.5">
                        {(v.items ?? [])
                          .map((i) => `${i.titulo} ×${i.cantidad}`)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-semibold text-ink text-sm">
                        {formatARS(v.total)}
                      </p>
                      <p
                        className={`text-xs font-medium mt-0.5 ${estadoVentaColor[v.estado]}`}
                      >
                        {estadoVentaLabel[v.estado]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Vendedores --- */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">
              Vendedores
            </h2>
            <span className="font-mono text-xs text-charcoal/50">
              {vendedores.length} vendedores
            </span>
          </div>

          {vendedoresCargando ? (
            <p className="text-sm text-charcoal/50">Cargando…</p>
          ) : vendedores.length === 0 ? (
            <div className="ficha bg-white border border-line p-8 text-center text-sm text-charcoal/60">
              Todavía no hay vendedores registrados.
            </div>
          ) : (
            <div className="space-y-2">
              {vendedores.map((v) => (
                <div
                  key={v.id}
                  className="ficha bg-white border border-line p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {v.nombreEmpresa}
                      </p>
                      {!v.verificado && (
                        <span className="shrink-0 text-[10px] font-mono uppercase text-amber-dark bg-amber/10 px-1.5 py-0.5 rounded-sm">
                          Sin verificar
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono uppercase text-charcoal/50 mt-0.5">
                      CUIT {v.cuit} · {v.email}
                    </p>
                    <p className="text-[11px] text-charcoal/50 mt-0.5">
                      {productos.filter((p) => p.vendedorId === v.id).length}{" "}
                      publicaciones
                    </p>
                  </div>
                  <button
                    onClick={() => handleBorrarVendedor(v)}
                    disabled={borrandoVendedor === v.id}
                    className="inline-flex items-center gap-1.5 text-xs text-clay border border-clay/40 rounded-stamp px-2.5 py-1.5 hover:bg-clay hover:text-white transition-colors disabled:opacity-60 shrink-0"
                  >
                    <Trash2 size={13} />
                    {borrandoVendedor === v.id ? "Eliminando…" : "Eliminar perfil"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
