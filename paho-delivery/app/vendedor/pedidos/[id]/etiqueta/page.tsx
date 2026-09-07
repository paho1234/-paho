"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import CodigoBarra from "@/components/CodigoBarra";
import { useAuth } from "@/contexts/AuthProvider";
import { getPedido, confirmarEntrega, type PedidoVendedor } from "@/lib/pedidos-vendedor";
import { formatARS } from "@/lib/firestore";
import { Printer, CheckCircle2, Truck } from "lucide-react";

type ModoImpresion = "envio" | "a4";

const condicionIVALabel: Record<string, string> = {
  responsable_inscripto: "Responsable Inscripto",
  monotributista: "Monotributista",
  exento: "Exento",
  consumidor_final: "Consumidor Final",
};

export default function EtiquetaPedidoPage({ params }: { params: { id: string } }) {
  const { user, rol, cargando: cargandoAuth } = useAuth();
  const [pedido, setPedido] = useState<PedidoVendedor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [noAutorizado, setNoAutorizado] = useState(false);
  const [modo, setModo] = useState<ModoImpresion>("envio");
  const [confirmando, setConfirmando] = useState(false);

  async function handleConfirmarEntrega() {
    if (!pedido) return;
    setConfirmando(true);
    try {
      await confirmarEntrega(pedido.id);
      setPedido({ ...pedido, entrega: "entregado", entregaConfirmadaEn: new Date() });
    } finally {
      setConfirmando(false);
    }
  }

  useEffect(() => {
    getPedido(params.id)
      .then(setPedido)
      .finally(() => setCargando(false));
  }, [params.id]);

  useEffect(() => {
    if (cargandoAuth || cargando) return;
    if (!pedido) return;
    // La lectura del doc ya está restringida por Firestore rules (solo
    // comprador o vendedor de esa orden pueden leerla) — este chequeo es
    // una segunda capa en el cliente, para no ni siquiera intentar
    // renderizar datos de un pedido ajeno si por algún motivo el fetch
    // igual devolviera algo.
    if (!user || rol !== "vendedor") {
      setNoAutorizado(true);
    }
  }, [user, rol, cargandoAuth, cargando, pedido]);

  if (cargandoAuth || cargando) {
    return (
      <main className="min-h-screen bg-paper-texture">
        <Header />
        <p className="text-center text-sm text-charcoal/50 py-24">
          Cargando…
        </p>
      </main>
    );
  }

  if (!pedido || noAutorizado) {
    return (
      <main className="min-h-screen bg-paper-texture">
        <Header />
        <p className="text-center text-sm text-charcoal/50 py-24">
          No encontramos este pedido, o no te pertenece.{" "}
          <Link href="/vendedor/pedidos" className="text-ink underline">
            Volver a mis pedidos
          </Link>
        </p>
      </main>
    );
  }

  const codigoCorto = pedido.id.slice(0, 8).toUpperCase();

  const contenido = (
    <>
      <div className="flex items-start justify-between mb-2">
        <p className="etiqueta-marca text-[10px] font-mono uppercase tracking-wider text-charcoal/50">
          Todo Regalado · Pedido #{codigoCorto}
        </p>
        <span className="etiqueta-metodo text-[9px] font-mono uppercase bg-ink text-paper px-1.5 py-0.5 rounded-sm">
          {pedido.envio.metodo === "domicilio" ? "Envío" : "Retiro"}
        </span>
      </div>

      <div className="etiqueta-comprador border-t border-b border-charcoal/20 py-2 my-2">
        <p className="text-[9px] font-mono uppercase text-charcoal/50 mb-0.5">
          Entregar a
        </p>
        <p className="font-display text-base font-semibold leading-tight">
          {pedido.facturacion.nombre}
        </p>
        <p className="text-xs text-charcoal/70">
          {pedido.facturacion.tipoDocumento} {pedido.facturacion.numeroDocumento}
          {" · "}
          {condicionIVALabel[pedido.facturacion.condicionIVA] ?? pedido.facturacion.condicionIVA}
        </p>
      </div>

      {pedido.envio.metodo === "domicilio" && pedido.envio.direccion ? (
        <div className="etiqueta-direccion mb-2">
          <p className="text-[9px] font-mono uppercase text-charcoal/50 mb-0.5">
            Dirección de envío
          </p>
          <p className="text-xs leading-snug">
            {pedido.envio.direccion.calle} {pedido.envio.direccion.numero}
            {pedido.envio.direccion.depto ? `, ${pedido.envio.direccion.depto}` : ""}
            <br />
            {pedido.envio.direccion.ciudad}, {pedido.envio.direccion.zona} — CP{" "}
            {pedido.envio.direccion.codigoPostal}
            <br />
            Tel: {pedido.envio.telefonoContacto}
          </p>
        </div>
      ) : (
        <p className="etiqueta-direccion text-xs text-charcoal/70 mb-2">
          Retira en tu local — confirmá identidad con el documento de
          arriba antes de entregar.
        </p>
      )}

      <div className="etiqueta-items mb-2">
        <p className="text-[9px] font-mono uppercase text-charcoal/50 mb-1">
          Productos
        </p>
        {pedido.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between text-xs py-0.5 gap-2"
          >
            <span className="truncate">
              {item.titulo} {item.cantidad > 1 ? `×${item.cantidad}` : ""}
            </span>
            <span className="shrink-0 font-mono">
              {formatARS(item.precio * item.cantidad)}
            </span>
          </div>
        ))}
        {pedido.envio.metodo === "domicilio" && pedido.envio.costo > 0 && (
          <div className="flex justify-between text-xs py-0.5 text-charcoal/60">
            <span>Envío</span>
            <span className="font-mono">{formatARS(pedido.envio.costo)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-semibold pt-1 border-t border-charcoal/20 mt-1">
          <span>Total</span>
          <span className="font-mono">{formatARS(pedido.total)}</span>
        </div>
      </div>

      <div className="etiqueta-barcode flex flex-col items-center pt-1">
        <CodigoBarra valor={pedido.id} width={1.4} height={38} />
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-paper-texture print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>

      <section className="mx-auto max-w-md px-5 py-12 print:py-0 print:px-0 print:max-w-none">
        <div className="print:hidden mb-6 space-y-4">
          <Link
            href="/vendedor/pedidos"
            className="text-sm text-ink underline block"
          >
            ← Volver a mis pedidos
          </Link>

          <div className="ficha bg-white border border-line p-3">
            <span className="text-xs font-medium block mb-2">
              Modo de impresión
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setModo("envio")}
                className={`flex-1 text-xs px-3 py-2 rounded-stamp border transition-colors ${
                  modo === "envio"
                    ? "bg-ink text-paper border-ink"
                    : "bg-white border-line text-charcoal/70 hover:border-ink/40"
                }`}
              >
                Etiqueta de envío
                <span className="block text-[10px] opacity-70">
                  10×15cm (impresora térmica)
                </span>
              </button>
              <button
                onClick={() => setModo("a4")}
                className={`flex-1 text-xs px-3 py-2 rounded-stamp border transition-colors ${
                  modo === "a4"
                    ? "bg-ink text-paper border-ink"
                    : "bg-white border-line text-charcoal/70 hover:border-ink/40"
                }`}
              >
                Comprobante A4
                <span className="block text-[10px] opacity-70">
                  Hoja completa
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-ink text-paper font-semibold px-4 py-3 rounded-stamp text-sm hover:bg-ink-light transition-colors"
          >
            <Printer size={16} />
            Imprimir
          </button>

          {pedido.entrega === "entregado" ? (
            <div className="flex items-center justify-center gap-2 text-moss text-sm font-medium py-2">
              <CheckCircle2 size={16} />
              Entregado
              {pedido.entregaConfirmadaEn &&
                ` el ${pedido.entregaConfirmadaEn.toLocaleDateString("es-AR")}`}
            </div>
          ) : (
            <button
              onClick={handleConfirmarEntrega}
              disabled={confirmando}
              className="w-full flex items-center justify-center gap-2 bg-moss text-white font-semibold px-4 py-3 rounded-stamp text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              <Truck size={16} />
              {confirmando
                ? "Confirmando…"
                : pedido.envio.metodo === "domicilio"
                  ? "Marcar como despachado"
                  : "Marcar como entregado"}
            </button>
          )}
        </div>

        <div
          className={
            modo === "envio"
              ? "etiqueta-envio ficha bg-white border-2 border-ink p-4 mx-auto"
              : "etiqueta-comprobante bg-white border border-line p-6 mx-auto"
          }
        >
          {contenido}
        </div>
      </section>

      {modo === "envio" ? (
        <style jsx global>{`
          @media print {
            @page {
              size: 100mm 150mm;
              margin: 4mm;
            }
            body {
              background: white !important;
            }
            .etiqueta-envio {
              width: 100%;
              border: none !important;
              clip-path: none !important;
              padding: 0 !important;
            }
          }
        `}</style>
      ) : (
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              background: white !important;
            }
            .etiqueta-comprobante {
              border: none !important;
              padding: 0 !important;
            }
          }
        `}</style>
      )}
    </main>
  );
}
