"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthProvider";
import { getBannerTexto, setBannerTexto, getLogoUrl, setLogoUrl } from "@/lib/config";
import {
  getTodosLosProductosAdmin,
  borrarProductoAdmin,
  getTodasLasVentasAdmin,
  getTodosLosVendedoresAdmin,
  borrarVendedorAdmin,
  setVendedorVerificadoAdmin,
  subirLogoAdmin,
  getTodosLosPagosAdmin,
  registrarPagoAdmin,
  type VentaAdmin,
  type VendedorAdmin,
  type PagoAdmin,
} from "@/lib/admin";
import { calcularResumenCuenta, COMISION_PLATAFORMA } from "@/lib/pagos";
import { formatARS, condicionLabel, type Producto } from "@/lib/firestore";
import { Trash2, Save, ShieldCheck, ImageIcon, Wallet } from "lucide-react";

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
  const { user, esAdmin, cargando } = useAuth();
  const router = useRouter();

  const [bannerTexto, setBannerTextoLocal] = useState("");
  const [bannerCargando, setBannerCargando] = useState(true);
  const [bannerGuardando, setBannerGuardando] = useState(false);
  const [bannerMensaje, setBannerMensaje] = useState<string | null>(null);

  const [logoUrl, setLogoUrlLocal] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoArchivo, setLogoArchivo] = useState<File | null>(null);
  const [logoCargando, setLogoCargando] = useState(true);
  const [logoGuardando, setLogoGuardando] = useState(false);
  const [logoMensaje, setLogoMensaje] = useState<string | null>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosCargando, setProductosCargando] = useState(true);
  const [borrandoProducto, setBorrandoProducto] = useState<string | null>(null);

  const [ventas, setVentas] = useState<VentaAdmin[]>([]);
  const [ventasCargando, setVentasCargando] = useState(true);

  const [vendedores, setVendedores] = useState<VendedorAdmin[]>([]);
  const [vendedoresCargando, setVendedoresCargando] = useState(true);
  const [borrandoVendedor, setBorrandoVendedor] = useState<string | null>(null);
  const [verificandoVendedor, setVerificandoVendedor] = useState<string | null>(null);

  const [pagos, setPagos] = useState<PagoAdmin[]>([]);
  const [pagosCargando, setPagosCargando] = useState(true);
  const [montoPago, setMontoPago] = useState<Record<string, string>>({});
  const [notaPago, setNotaPago] = useState<Record<string, string>>({});
  const [registrandoPago, setRegistrandoPago] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cargando) return;
    if (!user || !esAdmin) {
      router.push("/");
    }
  }, [user, esAdmin, cargando, router]);

  useEffect(() => {
    if (!user || !esAdmin) return;
    getBannerTexto()
      .then(setBannerTextoLocal)
      .finally(() => setBannerCargando(false));
    getLogoUrl()
      .then(setLogoUrlLocal)
      .finally(() => setLogoCargando(false));
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
    getTodosLosPagosAdmin()
      .then(setPagos)
      .catch(() => setError("No pudimos cargar los pagos."))
      .finally(() => setPagosCargando(false));
  }, [user, esAdmin]);

  // Nombre de vendedor a partir de su id, para mostrar en la lista de
  // ventas (la orden solo guarda vendedorId, no el nombre de fantasía).
  const nombreVendedor = (vendedorId: string) =>
    vendedores.find((v) => v.id === vendedorId)?.nombreEmpresa ?? vendedorId;

  function handleElegirLogo(e: { target: HTMLInputElement }) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoArchivo(file);
    setLogoMensaje(null);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleGuardarLogo() {
    if (!logoArchivo) return;
    setLogoGuardando(true);
    setLogoMensaje(null);
    try {
      const url = await subirLogoAdmin(logoArchivo);
      await setLogoUrl(url);
      setLogoUrlLocal(url);
      setLogoArchivo(null);
      setLogoPreview(null);
      setLogoMensaje("Logo actualizado.");
    } catch {
      setLogoMensaje("No se pudo subir el logo. Probá de nuevo.");
    } finally {
      setLogoGuardando(false);
    }
  }

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

  async function handleVerificarVendedor(vendedor: VendedorAdmin) {
    const nuevoEstado = !vendedor.verificado;
    const confirmado = window.confirm(
      nuevoEstado
        ? `¿Aprobar a "${vendedor.nombreEmpresa}"? Va a poder publicar productos.`
        : `¿Quitarle la aprobación a "${vendedor.nombreEmpresa}"? Deja de poder publicar productos nuevos (los que ya publicó siguen visibles).`
    );
    if (!confirmado) return;

    setVerificandoVendedor(vendedor.id);
    try {
      await setVendedorVerificadoAdmin(vendedor.id, nuevoEstado);
      setVendedores((prev) =>
        prev.map((v) =>
          v.id === vendedor.id ? { ...v, verificado: nuevoEstado } : v
        )
      );
    } catch {
      setError(`No se pudo actualizar a "${vendedor.nombreEmpresa}". Probá de nuevo.`);
    } finally {
      setVerificandoVendedor(null);
    }
  }

  async function handleRegistrarPago(vendedor: VendedorAdmin) {
    const montoTexto = (montoPago[vendedor.id] ?? "").replace(",", ".");
    const monto = parseFloat(montoTexto);
    if (!monto || monto <= 0) {
      setError("Ingresá un monto válido para registrar el pago.");
      return;
    }
    const confirmado = window.confirm(
      `¿Confirmás que le transferiste ${formatARS(monto)} a "${vendedor.nombreEmpresa}"? Esto va a quedar registrado en su estado de cuenta.`
    );
    if (!confirmado) return;

    setRegistrandoPago(vendedor.id);
    try {
      await registrarPagoAdmin(vendedor.id, monto, notaPago[vendedor.id] ?? "");
      const nuevos = await getTodosLosPagosAdmin();
      setPagos(nuevos);
      setMontoPago((prev) => ({ ...prev, [vendedor.id]: "" }));
      setNotaPago((prev) => ({ ...prev, [vendedor.id]: "" }));
    } catch {
      setError("No se pudo registrar el pago. Probá de nuevo.");
    } finally {
      setRegistrandoPago(null);
    }
  }

  if (cargando || !user || !esAdmin) {
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

        {/* --- Logo --- */}
        <div className="ficha bg-white border border-line p-5 mb-10">
          <h2 className="font-display text-lg font-semibold mb-3">
            Logo del sitio
          </h2>
          {logoCargando ? (
            <p className="text-sm text-charcoal/50">Cargando…</p>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-20 h-20 rounded-stamp border border-line bg-paper flex items-center justify-center overflow-hidden">
                  {logoPreview || logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview ?? logoUrl ?? ""}
                      alt="Logo actual"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={22} className="text-charcoal/30" />
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 text-sm text-ink border border-line rounded-stamp px-3 py-2 cursor-pointer hover:border-ink/40 transition-colors">
                    Elegir imagen…
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleElegirLogo}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-charcoal/50 mt-1">
                    PNG o JPG, hasta 5 MB. Se recomienda fondo transparente.
                  </p>
                </div>
              </div>
              {logoArchivo && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGuardarLogo}
                    disabled={logoGuardando}
                    className="inline-flex items-center gap-1.5 text-sm bg-ink text-white font-medium rounded-stamp px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    <Save size={14} />
                    {logoGuardando ? "Subiendo…" : "Guardar logo nuevo"}
                  </button>
                  <span className="text-xs text-charcoal/60">
                    {logoArchivo.name}
                  </span>
                </div>
              )}
              {logoMensaje && (
                <span className="text-xs text-charcoal/60 block mt-2">
                  {logoMensaje}
                </span>
              )}
            </>
          )}
        </div>

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

        {/* --- Cuenta corriente por vendedor --- */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Wallet size={17} className="text-ink" />
              Cuenta corriente
            </h2>
            <span className="font-mono text-xs text-charcoal/50">
              comisión {(COMISION_PLATAFORMA * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-charcoal/60 text-sm mb-4">
            Lo que le corresponde a cada vendedor después de descontar la
            comisión de la plataforma, y lo que ya se le transfirió.
          </p>

          {ventasCargando || vendedoresCargando || pagosCargando ? (
            <p className="text-sm text-charcoal/50">Cargando…</p>
          ) : vendedores.length === 0 ? (
            <div className="ficha bg-white border border-line p-8 text-center text-sm text-charcoal/60">
              Todavía no hay vendedores registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {vendedores.map((v) => {
                const ventasDeEste = ventas.filter(
                  (venta) => venta.vendedorId === v.id && venta.estado === "pagado"
                );
                const pagosDeEste = pagos.filter((p) => p.vendedorId === v.id);
                const resumen = calcularResumenCuenta(ventasDeEste, pagosDeEste);
                return (
                  <div key={v.id} className="ficha bg-white border border-line p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                      <p className="text-sm font-medium">{v.nombreEmpresa}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-charcoal/50">
                          Bruto {formatARS(resumen.bruto)}
                        </span>
                        <span className="text-charcoal/50">
                          Neto {formatARS(resumen.neto)}
                        </span>
                        <span className="text-moss">
                          Pagado {formatARS(resumen.pagado)}
                        </span>
                        <span className="font-display font-semibold text-ink">
                          Pendiente {formatARS(resumen.saldoPendiente)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Monto a transferir"
                        value={montoPago[v.id] ?? ""}
                        onChange={(e) =>
                          setMontoPago((prev) => ({ ...prev, [v.id]: e.target.value }))
                        }
                        className="w-40 rounded-stamp border border-line px-3 py-1.5 text-sm focus:outline-none focus:border-ink/40"
                      />
                      <input
                        type="text"
                        placeholder="Nota (opcional)"
                        value={notaPago[v.id] ?? ""}
                        onChange={(e) =>
                          setNotaPago((prev) => ({ ...prev, [v.id]: e.target.value }))
                        }
                        className="flex-1 min-w-[160px] rounded-stamp border border-line px-3 py-1.5 text-sm focus:outline-none focus:border-ink/40"
                      />
                      <button
                        onClick={() => handleRegistrarPago(v)}
                        disabled={registrandoPago === v.id}
                        className="inline-flex items-center gap-1.5 bg-moss text-white text-xs font-medium rounded-stamp px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        {registrandoPago === v.id ? "Registrando…" : "Registrar pago"}
                      </button>
                    </div>
                  </div>
                );
              })}
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
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => handleVerificarVendedor(v)}
                      disabled={verificandoVendedor === v.id}
                      className={
                        v.verificado
                          ? "inline-flex items-center gap-1.5 text-xs text-charcoal/70 border border-line rounded-stamp px-2.5 py-1.5 hover:border-ink/40 transition-colors disabled:opacity-60"
                          : "inline-flex items-center gap-1.5 text-xs bg-moss text-white font-medium rounded-stamp px-2.5 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
                      }
                    >
                      <ShieldCheck size={13} />
                      {verificandoVendedor === v.id
                        ? "Guardando…"
                        : v.verificado
                        ? "Quitar aprobación"
                        : "Aprobar vendedor"}
                    </button>
                    <button
                      onClick={() => handleBorrarVendedor(v)}
                      disabled={borrandoVendedor === v.id}
                      className="inline-flex items-center gap-1.5 text-xs text-clay border border-clay/40 rounded-stamp px-2.5 py-1.5 hover:bg-clay hover:text-white transition-colors disabled:opacity-60"
                    >
                      <Trash2 size={13} />
                      {borrandoVendedor === v.id ? "Eliminando…" : "Eliminar perfil"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
