"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useCartStore } from "@/store/cart";
import { formatARS } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthProvider";
import { Minus, Plus, Trash2 } from "lucide-react";

import type { ZonaEnvio } from "@/lib/ordenes";

type MetodoEnvio = "retiro" | "domicilio";

export default function CarritoPage() {
  const {
    items,
    actualizarCantidad,
    quitar,
    total,
    metodosDisponibles,
    costoEnvioTotal,
  } = useCartStore();
  const { user, cargando: cargandoAuth } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metodos = metodosDisponibles();
  const [metodoEnvio, setMetodoEnvio] = useState<MetodoEnvio | null>(null);

  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [depto, setDepto] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [zona, setZona] = useState<ZonaEnvio>("CABA");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [telefono, setTelefono] = useState("");

  const metodoActivo =
    metodoEnvio ?? (metodos.retiro ? "retiro" : metodos.envioDomicilio ? "domicilio" : null);

  const costoEnvio = metodoActivo === "domicilio" ? costoEnvioTotal() : 0;
  const totalConEnvio = total() + costoEnvio;

  async function irAPagar() {
    setError(null);

    if (!metodoActivo) {
      setError(
        "Los productos de tu carrito no comparten un método de entrega en común. Separalos en compras distintas."
      );
      return;
    }

    let direccionEnvio = null;
    if (metodoActivo === "domicilio") {
      if (!calle.trim() || !numero.trim() || !ciudad.trim() || !codigoPostal.trim() || !telefono.trim()) {
        setError("Completá todos los datos de envío.");
        return;
      }
      direccionEnvio = { calle, numero, depto, ciudad, zona, codigoPostal };
    }

    setCargando(true);
    try {
      const res = await fetch("/api/mercadopago/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          compradorId: user?.uid,
          metodoEnvio: metodoActivo,
          direccionEnvio,
          telefonoEnvio: metodoActivo === "domicilio" ? telefono : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar el pago");
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos iniciar el pago. Intentá de nuevo."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />

      <section className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-3xl font-semibold mb-8">
          Tu carrito
        </h1>

        {items.length === 0 ? (
          <p className="text-charcoal/60 text-sm">
            Todavía no agregaste productos.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="ficha flex items-center gap-4 bg-white border border-line p-4"
              >
                <div className="flex-1">
                  <p className="text-[11px] font-mono uppercase text-charcoal/50">
                    {item.vendedor}
                  </p>
                  <h3 className="text-sm font-medium">{item.titulo}</h3>
                  <p className="font-display font-semibold text-ink mt-1">
                    {formatARS(item.precio)}
                  </p>
                </div>

                <div className="flex items-center gap-2 border border-line rounded-stamp px-2 py-1">
                  <button
                    onClick={() =>
                      actualizarCantidad(item.id, item.cantidad - 1)
                    }
                    className="p-1 hover:text-clay"
                    aria-label="Restar"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-mono text-sm w-5 text-center">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() =>
                      actualizarCantidad(item.id, item.cantidad + 1)
                    }
                    disabled={item.cantidad >= item.stock}
                    className="p-1 hover:text-moss disabled:opacity-30 disabled:hover:text-inherit disabled:cursor-not-allowed"
                    aria-label="Sumar"
                    title={
                      item.cantidad >= item.stock
                        ? "No hay más stock disponible"
                        : undefined
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => quitar(item.id)}
                  className="p-2 text-charcoal/40 hover:text-clay"
                  aria-label="Quitar del carrito"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Método de entrega */}
            <div className="ficha bg-white border border-line p-4">
              <span className="text-sm font-medium block mb-3">Entrega</span>

              {!metodos.retiro && !metodos.envioDomicilio ? (
                <p className="text-sm text-clay">
                  Los productos de tu carrito no comparten un método de
                  entrega en común. Separalos en compras distintas.
                </p>
              ) : (
                <div className="space-y-3">
                  {metodos.retiro && (
                    <label className="flex items-center gap-2.5 text-sm">
                      <input
                        type="radio"
                        name="metodoEnvio"
                        checked={metodoActivo === "retiro"}
                        onChange={() => setMetodoEnvio("retiro")}
                        className="accent-ink"
                      />
                      Retiro en el local del vendedor — sin costo
                    </label>
                  )}
                  {metodos.envioDomicilio && (
                    <label className="flex items-center gap-2.5 text-sm">
                      <input
                        type="radio"
                        name="metodoEnvio"
                        checked={metodoActivo === "domicilio"}
                        onChange={() => setMetodoEnvio("domicilio")}
                        className="accent-ink"
                      />
                      Envío a domicilio —{" "}
                      {costoEnvioTotal() ? formatARS(costoEnvioTotal()) : "gratis"}
                    </label>
                  )}

                  {metodoActivo === "domicilio" && (
                    <div className="pl-6 pt-2 space-y-3">
                      <p className="text-xs text-charcoal/50 bg-amber/10 border border-amber-dark/20 rounded-stamp px-3 py-2">
                        Por ahora hacemos envíos solo dentro del AMBA
                        (Capital Federal y Gran Buenos Aires).
                      </p>
                      <div className="grid grid-cols-[1fr_100px] gap-3">
                        <CampoDireccion label="Calle" value={calle} onChange={setCalle} />
                        <CampoDireccion label="Número" value={numero} onChange={setNumero} />
                      </div>
                      <CampoDireccion label="Depto / Piso (opcional)" value={depto} onChange={setDepto} />
                      <div className="grid grid-cols-2 gap-3">
                        <CampoDireccion
                          label="Barrio / Partido"
                          value={ciudad}
                          onChange={setCiudad}
                        />
                        <label className="block">
                          <span className="text-xs font-medium block mb-1">
                            Zona
                          </span>
                          <select
                            value={zona}
                            onChange={(e) => setZona(e.target.value as ZonaEnvio)}
                            className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink bg-white"
                          >
                            <option value="CABA">CABA</option>
                            <option value="GBA">GBA (provincia de Buenos Aires)</option>
                          </select>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <CampoDireccion label="Código postal" value={codigoPostal} onChange={setCodigoPostal} />
                        <CampoDireccion label="Teléfono de contacto" value={telefono} onChange={setTelefono} />
                      </div>
                      <p className="text-xs text-charcoal/50">
                        Esta dirección y teléfono se los mostramos al
                        vendedor únicamente para coordinar el envío.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-line space-y-1">
              <div className="flex items-center justify-between text-sm text-charcoal/60">
                <span>Productos</span>
                <span>{formatARS(total())}</span>
              </div>
              {metodoActivo === "domicilio" && (
                <div className="flex items-center justify-between text-sm text-charcoal/60">
                  <span>Envío</span>
                  <span>{costoEnvio ? formatARS(costoEnvio) : "Gratis"}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="font-display text-lg font-semibold">
                  Total
                </span>
                <span className="font-display text-2xl font-semibold text-ink">
                  {formatARS(totalConEnvio)}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-clay text-sm font-medium">{error}</p>
            )}

            {!cargandoAuth && !user ? (
              <div className="text-center bg-white border border-line rounded-stamp p-4">
                <p className="text-sm text-charcoal/70 mb-3">
                  Iniciá sesión para pagar — lo necesitamos para emitirte la
                  factura.
                </p>
                <Link
                  href="/login"
                  className="inline-block bg-ink text-paper font-semibold px-6 py-2.5 rounded-stamp hover:bg-ink-light transition-colors text-sm"
                >
                  Iniciar sesión
                </Link>
              </div>
            ) : (
              <button
                onClick={irAPagar}
                disabled={cargando || !metodoActivo}
                className="w-full bg-amber text-ink font-semibold py-3 rounded-stamp hover:bg-amber-dark transition-colors disabled:opacity-60"
              >
                {cargando
                  ? "Redirigiendo a Mercado Pago…"
                  : "Pagar con Mercado Pago"}
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function CampoDireccion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink bg-white"
      />
    </label>
  );
}
