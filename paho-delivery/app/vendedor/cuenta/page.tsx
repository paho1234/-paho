"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthProvider";
import { getPedidosDeVendedor, type PedidoVendedor } from "@/lib/pedidos-vendedor";
import {
  getPagosDeVendedor,
  calcularResumenCuenta,
  COMISION_PLATAFORMA,
  type Pago,
} from "@/lib/pagos";
import { formatARS } from "@/lib/firestore";
import { Wallet } from "lucide-react";

export default function CuentaVendedorPage() {
  const { user, rol, cargando } = useAuth();
  const router = useRouter();
  const [ventas, setVentas] = useState<PedidoVendedor[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    Promise.all([getPedidosDeVendedor(user.uid), getPagosDeVendedor(user.uid)])
      .then(([todasLasVentas, pagosDelVendedor]) => {
        setVentas(todasLasVentas.filter((v) => v.estado === "pagado"));
        setPagos(pagosDelVendedor);
      })
      .catch(() => setError("No pudimos cargar tu estado de cuenta."))
      .finally(() => setCargandoDatos(false));
  }, [user, rol]);

  if (cargando || !user || rol !== "vendedor") {
    return (
      <main className="min-h-screen bg-paper-texture">
        <Header />
        <p className="text-center text-sm text-charcoal/50 py-24">Cargando…</p>
      </main>
    );
  }

  const resumen = calcularResumenCuenta(ventas, pagos);

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-3xl font-semibold">
            Estado de cuenta
          </h1>
          <Link href="/vendedor" className="text-sm text-ink underline">
            ← Volver a mi panel
          </Link>
        </div>
        <p className="text-charcoal/60 text-sm mb-10">
          Todo Regalado cobra un {(COMISION_PLATAFORMA * 100).toFixed(0)}% de
          comisión por venta y te transfiere el resto una vez por mes.
        </p>

        {cargandoDatos ? (
          <p className="text-sm text-charcoal/50">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-clay">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-10">
              <div className="ficha bg-white border border-line p-4">
                <p className="text-[11px] uppercase text-charcoal/50 mb-1">
                  Ventas (bruto)
                </p>
                <p className="font-display font-semibold text-ink">
                  {formatARS(resumen.bruto)}
                </p>
              </div>
              <div className="ficha bg-white border border-line p-4">
                <p className="text-[11px] uppercase text-charcoal/50 mb-1">
                  Comisión ({(COMISION_PLATAFORMA * 100).toFixed(0)}%)
                </p>
                <p className="font-display font-semibold text-clay">
                  -{formatARS(resumen.comision)}
                </p>
              </div>
              <div className="ficha bg-white border border-line p-4">
                <p className="text-[11px] uppercase text-charcoal/50 mb-1">
                  Ya transferido
                </p>
                <p className="font-display font-semibold text-moss">
                  {formatARS(resumen.pagado)}
                </p>
              </div>
              <div className="ficha bg-ink text-white p-4">
                <p className="text-[11px] uppercase text-white/60 mb-1 flex items-center gap-1">
                  <Wallet size={12} />
                  Saldo pendiente
                </p>
                <p className="font-display font-semibold">
                  {formatARS(resumen.saldoPendiente)}
                </p>
              </div>
            </div>

            <h2 className="font-display text-xl font-semibold mb-4">
              Ventas con pago confirmado
            </h2>
            {ventas.length === 0 ? (
              <div className="ficha bg-white border border-line p-8 text-center text-sm text-charcoal/60 mb-10">
                Todavía no tenés ventas con el pago confirmado.
              </div>
            ) : (
              <div className="space-y-2 mb-10">
                {ventas.map((v) => {
                  const comisionVenta = v.total * COMISION_PLATAFORMA;
                  const netoVenta = v.total - comisionVenta;
                  return (
                    <div
                      key={v.id}
                      className="ficha bg-white border border-line p-4 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono uppercase text-charcoal/50">
                          {v.creadoEn
                            ? v.creadoEn.toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Fecha no disponible"}
                        </p>
                        <p className="text-xs text-charcoal/60 mt-0.5 truncate">
                          {(v.items ?? [])
                            .map((i) => `${i.titulo} ×${i.cantidad}`)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm text-charcoal/50">
                          {formatARS(v.total)} − {formatARS(comisionVenta)}
                        </p>
                        <p className="font-display font-semibold text-ink">
                          {formatARS(netoVenta)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <h2 className="font-display text-xl font-semibold mb-4">
              Pagos recibidos
            </h2>
            {pagos.length === 0 ? (
              <div className="ficha bg-white border border-line p-8 text-center text-sm text-charcoal/60">
                Todavía no recibiste ninguna transferencia.
              </div>
            ) : (
              <div className="space-y-2">
                {pagos.map((p) => (
                  <div
                    key={p.id}
                    className="ficha bg-white border border-line p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono uppercase text-charcoal/50">
                        {p.creadoEn
                          ? p.creadoEn.toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Fecha no disponible"}
                      </p>
                      {p.nota && (
                        <p className="text-xs text-charcoal/60 mt-0.5">
                          {p.nota}
                        </p>
                      )}
                    </div>
                    <p className="font-display font-semibold text-moss shrink-0">
                      +{formatARS(p.monto)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
