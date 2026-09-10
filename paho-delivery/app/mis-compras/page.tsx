"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthProvider";
import {
  getPedidosDeComprador,
  type PedidoComprador,
} from "@/lib/pedidos-comprador";
import { formatARS } from "@/lib/firestore";
import { CheckCircle2, Clock, Truck, MapPin } from "lucide-react";

const estadoLabel: Record<PedidoComprador["estado"], string> = {
  pendiente_pago: "Pago pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

const estadoColor: Record<PedidoComprador["estado"], string> = {
  pendiente_pago: "text-amber-dark",
  pagado: "text-moss",
  cancelado: "text-clay",
};

export default function MisComprasPage() {
  const { user, cargando } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoComprador[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cargando) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, cargando, router]);

  useEffect(() => {
    if (!user) return;
    getPedidosDeComprador(user.uid)
      .then(setPedidos)
      .catch(() => setError("No pudimos cargar tus compras."))
      .finally(() => setCargandoPedidos(false));
  }, [user]);

  if (cargando || !user) {
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
            Mis compras
          </h1>
          <Link href="/" className="text-sm text-ink underline">
            ← Volver al catálogo
          </Link>
        </div>
        <p className="text-charcoal/60 text-sm mb-10">
          Acá vas a ver todo lo que compraste en Todo Regalado.
        </p>

        {cargandoPedidos ? (
          <p className="text-sm text-charcoal/50">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-clay">{error}</p>
        ) : pedidos.length === 0 ? (
          <div className="ficha bg-white border border-line p-8 text-center text-sm text-charcoal/60">
            Todavía no hiciste ninguna compra.
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
                    <p className="text-xs text-charcoal/60 mt-0.5">
                      {(p.items ?? [])
                        .map((i) => `${i.titulo} ×${i.cantidad}`)
                        .join(", ")}
                    </p>
                    <p className="text-xs text-charcoal/50 mt-1">
                      {p.envio?.metodo === "domicilio"
                        ? "Envío a domicilio"
                        : "Retiro en el local"}
                    </p>
                    {p.envio?.metodo === "retiro" && p.envio.direccionRetiro && (
                      <p className="text-xs text-charcoal/70 mt-1 flex items-start gap-1">
                        <MapPin size={13} className="shrink-0 mt-0.5" />
                        <span>
                          {p.envio.direccionRetiro.calle}{" "}
                          {p.envio.direccionRetiro.numero},{" "}
                          {p.envio.direccionRetiro.barrio} (
                          {p.envio.direccionRetiro.zona}, CP{" "}
                          {p.envio.direccionRetiro.codigoPostal})
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-semibold text-ink">
                      {formatARS(p.total)}
                    </p>
                    <p
                      className={`text-xs font-medium mt-0.5 ${estadoColor[p.estado]}`}
                    >
                      {estadoLabel[p.estado]}
                    </p>
                  </div>
                </div>

                {p.entrega === "entregado" ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-moss font-medium">
                    <CheckCircle2 size={13} />
                    {p.envio?.metodo === "domicilio"
                      ? "Despachado"
                      : "Entregado"}
                    {p.entregaConfirmadaEn &&
                      ` el ${p.entregaConfirmadaEn.toLocaleDateString("es-AR")}`}
                  </span>
                ) : p.estado === "pagado" ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-dark font-medium">
                    <Truck size={13} />
                    {p.envio?.metodo === "domicilio"
                      ? "Preparando el despacho"
                      : "Listo para retirar en breve"}
                  </span>
                ) : (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-charcoal/50 font-medium">
                    <Clock size={13} />
                    Esperando confirmación del pago
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
