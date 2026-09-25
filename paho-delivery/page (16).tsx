"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import CodigoBarra from "@/components/CodigoBarra";
import { useAuth } from "@/contexts/AuthProvider";
import { getProducto, formatARS, condicionLabel, type Producto } from "@/lib/firestore";
import { Printer } from "lucide-react";

type ModoImpresion = "termica" | "a4";

export default function EtiquetaPage({ params }: { params: { id: string } }) {
  const { user, rol, cargando: cargandoAuth } = useAuth();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [noAutorizado, setNoAutorizado] = useState(false);
  const [modo, setModo] = useState<ModoImpresion>("termica");

  useEffect(() => {
    getProducto(params.id).then((p) => {
      setProducto(p);
      setCargando(false);
    });
  }, [params.id]);

  useEffect(() => {
    if (cargandoAuth || cargando || !producto) return;
    if (!user || rol !== "vendedor" || producto.vendedorId !== user.uid) {
      setNoAutorizado(true);
    }
  }, [user, rol, cargandoAuth, cargando, producto]);

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

  if (!producto || noAutorizado) {
    return (
      <main className="min-h-screen bg-paper-texture">
        <Header />
        <p className="text-center text-sm text-charcoal/50 py-24">
          No encontramos esta publicación, o no te pertenece.{" "}
          <Link href="/vendedor" className="text-ink underline">
            Volver a mi panel
          </Link>
        </p>
      </main>
    );
  }

  const etiquetaContenido = (
    <>
      <p className="etiqueta-marca text-[10px] font-mono uppercase tracking-wider text-charcoal/50 mb-1">
        Todo Regalado · {producto.categoriaLabel}
      </p>
      <h1 className="etiqueta-titulo font-display text-sm font-semibold leading-tight mb-1">
        {producto.titulo}
      </h1>
      <p className="etiqueta-condicion text-[10px] text-moss font-mono uppercase mb-2">
        {condicionLabel[producto.condicion]}
      </p>
      <p className="etiqueta-precio font-display text-xl font-bold text-ink mb-2">
        {formatARS(producto.precio)}
      </p>
      <div className="etiqueta-barcode flex justify-center">
        <CodigoBarra valor={producto.id} />
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
          <Link href="/vendedor" className="text-sm text-ink underline block">
            ← Volver a mi panel
          </Link>

          <div className="ficha bg-white border border-line p-3">
            <span className="text-xs font-medium block mb-2">
              Modo de impresión
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setModo("termica")}
                className={`flex-1 text-xs px-3 py-2 rounded-stamp border transition-colors ${
                  modo === "termica"
                    ? "bg-ink text-paper border-ink"
                    : "bg-white border-line text-charcoal/70 hover:border-ink/40"
                }`}
              >
                Impresora térmica
                <span className="block text-[10px] opacity-70">
                  Una etiqueta, 62×40mm
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
                Hoja A4
                <span className="block text-[10px] opacity-70">
                  Grilla para recortar
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-ink text-paper font-semibold px-4 py-3 rounded-stamp text-sm hover:bg-ink-light transition-colors"
          >
            <Printer size={16} />
            Imprimir etiqueta
          </button>
        </div>

        {modo === "termica" ? (
          <div className="etiqueta-termica ficha bg-white border-2 border-ink p-4 mx-auto">
            {etiquetaContenido}
          </div>
        ) : (
          <div className="etiqueta-a4-grid">
            {Array.from({ length: Math.max(1, producto.stock) }).map((_, i) => (
              <div key={i} className="etiqueta-a4-item border border-charcoal/30 p-3">
                {etiquetaContenido}
              </div>
            ))}
          </div>
        )}

        {modo === "a4" && (
          <p className="print:hidden text-xs text-charcoal/50 text-center mt-3">
            Imprimiendo {Math.max(1, producto.stock)} etiqueta
            {producto.stock === 1 ? "" : "s"} (según el stock cargado).
          </p>
        )}

        <p className="print:hidden text-xs text-charcoal/50 text-center mt-4">
          El código de barras identifica esta publicación puntual — útil
          para pegar en el producto físico cuando el stock es 1 unidad, y
          no perder el rastro entre productos parecidos.
        </p>
      </section>

      {modo === "termica" ? (
        <style jsx global>{`
          @media print {
            @page {
              size: 62mm 40mm;
              margin: 2mm;
            }
            body {
              background: white !important;
            }
            .etiqueta-termica {
              width: 100%;
              border: none !important;
              clip-path: none !important;
              padding: 0 !important;
            }
          }
        `}</style>
      ) : (
        <style jsx global>{`
          @media screen {
            .etiqueta-a4-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .etiqueta-a4-item {
              border-radius: 3px;
            }
          }
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              background: white !important;
            }
            .etiqueta-a4-grid {
              display: grid;
              grid-template-columns: repeat(2, 62mm);
              justify-content: center;
              gap: 4mm 8mm;
            }
            .etiqueta-a4-item {
              width: 62mm;
              height: 40mm;
              overflow: hidden;
              box-sizing: border-box;
              border: 1px dashed #999 !important;
            }
          }
        `}</style>
      )}
    </main>
  );
}
