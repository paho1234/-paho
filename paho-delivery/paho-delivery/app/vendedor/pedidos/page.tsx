"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthProvider";
import { getPedidosDeVendedor, confirmarEntrega, type PedidoVendedor } from "@/lib/pedidos-vendedor";
import { formatARS } from "@/lib/firestore";
import { Tag, CheckCircle2, Truck } from "lucide-react";

const estadoLabel: Record<PedidoVendedor["estado"], string> = {
  pendiente_pago: "Pago pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

const estadoColor: Record<PedidoVendedor["estado"], string> = {
  pendiente_pago: "text-amber-dark",
  pagado: "text-moss",
  cancelado: "text-clay",
};

export default function PedidosPage() {
  const { user, rol, cargando } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoVendedor[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);

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
    getPedidosDeVendedor(user.uid)
      .then(setPedidos)
      .catch(() => setError("No pudimos cargar tus pedidos."))
      .finally(() => setCargandoPedidos(false));
  }, [user, rol]);

  async function handleConfirmarEntrega(id: string) {
    setConfirmando(id);
    try {
      await confirmarEntrega(id);
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, entrega: "entregado", entregaConfirmadaEn: new Date() }
            : p
        )
      );
    } catch {
      setError("No pudimos marcar el pedido como entregado. Probá de nuevo.");
    } finally {
      setConfirmando(null);
    }
  }

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
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-3xl font-semibold">
            Mis pedidos
          </h1>
          <Link href="/vendedor" className="text-sm text-ink underline">
            ← Volver a mi panel
          </Link>
        </div>
        <p className="text-charcoal/60 text-sm mb-10">
          Cada vez que alguien compra uno de tus productos, aparece acá.
        </p>

        {cargandoPedidos ? (
          <p className="text-sm text-charcoal/50">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-clay">{error}</p>
        ) : pedidos.length === 0 ? (
          <div className="ficha bg-white border border-line p-8 text-center text-sm text-charcoal/60">
            Todavía no tenés pedidos.
          </div>
        ) : (
          <div className="space-y-2">
            {pedidos.map((p) => (
              <div key={p.id} className="ficha bg-white border border-line p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono uppercase text-charcoal/50">
                      {p.creadoEn
                        ? p.creadoEn.toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Fecha no disponible"}
                    </p>
                    <p className="text-sm font-medium">
                      {p.facturacion.nombre}
                    </p>
                    <p className="text-xs text-charcoal/60 mt-0.5">
                      {p.items.map((i) => `${i.titulo} ×${i.cantidad}`).join(", ")}
                    </p>
                    <p className="text-xs text-charcoal/50 mt-1">
                      {p.envio.metodo === "domicilio"
                        ? "Envío a domicilio"
                        : "Retiro en el local"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-semibold text-ink">
                      {formatARS(p.total)}
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${estadoColor[p.estado]}`}>
                      {estadoLabel[p.estado]}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/vendedor/pedidos/${p.id}/etiqueta`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink border border-line rounded-stamp px-2.5 py-1.5 hover:border-ink/40 transition-colors"
                >
                  <Tag size={13} />
                  Ver / imprimir etiqueta del pedido
                </Link>

                {p.entrega === "entregado" ? (
                  <span className="mt-3 ml-2 inline-flex items-center gap-1.5 text-xs text-moss font-medium">
                    <CheckCircle2 size={13} />
                    Entregado
                    {p.entregaConfirmadaEn &&
                      ` el ${p.entregaConfirmadaEn.toLocaleDateString("es-AR")}`}
                  </span>
                ) : (
                  <button
                    onClick={() => handleConfirmarEntrega(p.id)}
                    disabled={confirmando === p.id}
                    className="mt-3 ml-2 inline-flex items-center gap-1.5 text-xs bg-moss text-white font-medium rounded-stamp px-2.5 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    <Truck size={13} />
                    {confirmando === p.id
                      ? "Confirmando…"
                      : p.envio.metodo === "domicilio"
                        ? "Marcar como despachado"
                        : "Marcar como entregado"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
