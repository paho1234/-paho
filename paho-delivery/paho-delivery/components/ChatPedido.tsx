"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { escucharMensajes, enviarMensaje, type Mensaje, type AutorRol } from "@/lib/mensajes";

type Props = {
  ordenId: string;
  usuarioId: string;
  miRol: AutorRol;
};

/**
 * Chat simple entre comprador y vendedor, atado a un pedido puntual.
 * Se usa tanto desde /mis-compras/[id]/mensajes (comprador) como desde
 * /vendedor/pedidos/[id]/mensajes (vendedor) — la única diferencia entre
 * ambos usos es `miRol`, para saber a nombre de quién se manda cada
 * mensaje y para alinear las burbujas propias a la derecha.
 */
export default function ChatPedido({ ordenId, usuarioId, miRol }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = escucharMensajes(
      ordenId,
      (nuevos) => {
        setMensajes(nuevos);
        setCargando(false);
      },
      () => {
        setError("No pudimos cargar los mensajes.");
        setCargando(false);
      }
    );
    return unsub;
  }, [ordenId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    const textoAEnviar = texto.trim();
    if (!textoAEnviar || enviando) return;
    setEnviando(true);
    setTexto("");
    try {
      await enviarMensaje(ordenId, usuarioId, miRol, textoAEnviar);
    } catch {
      setError("No pudimos enviar el mensaje. Probá de nuevo.");
      setTexto(textoAEnviar);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="ficha bg-white border border-line flex flex-col h-[65vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cargando ? (
          <p className="text-sm text-charcoal/50 text-center py-8">Cargando…</p>
        ) : mensajes.length === 0 ? (
          <p className="text-sm text-charcoal/50 text-center py-8">
            Todavía no hay mensajes. Escribí el primero.
          </p>
        ) : (
          mensajes.map((m) => {
            const esMio = m.autorId === usuarioId;
            return (
              <div
                key={m.id}
                className={`flex ${esMio ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-stamp px-3 py-2 text-sm ${
                    esMio
                      ? "bg-ink text-white"
                      : "bg-paper-texture border border-line text-charcoal"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      esMio ? "text-white/60" : "text-charcoal/40"
                    }`}
                  >
                    {m.autorRol === "vendedor" ? "Vendedor" : "Comprador"}
                    {m.creadoEn &&
                      ` · ${m.creadoEn.toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={finRef} />
      </div>

      {error && (
        <p className="px-4 pb-2 text-xs text-clay">{error}</p>
      )}

      <form
        onSubmit={handleEnviar}
        className="border-t border-line p-3 flex items-center gap-2"
      >
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí un mensaje…"
          maxLength={2000}
          className="flex-1 rounded-stamp border border-line px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
        />
        <button
          type="submit"
          disabled={!texto.trim() || enviando}
          className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium rounded-stamp px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
