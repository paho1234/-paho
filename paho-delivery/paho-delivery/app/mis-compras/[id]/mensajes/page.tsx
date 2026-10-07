"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import ChatPedido from "@/components/ChatPedido";
import { useAuth } from "@/contexts/AuthProvider";
import { getPedidoComprador, type PedidoComprador } from "@/lib/pedidos-comprador";

export default function MensajesCompradorPage() {
  const { user, cargando } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<PedidoComprador | null>(null);
  const [cargandoPedido, setCargandoPedido] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cargando) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, cargando, router]);

  useEffect(() => {
    if (!user) return;
    getPedidoComprador(params.id)
      .then((p) => {
        if (!p || p.compradorId !== user.uid) {
          setError("No encontramos ese pedido.");
          return;
        }
        setPedido(p);
      })
      .catch(() => setError("No pudimos cargar el pedido."))
      .finally(() => setCargandoPedido(false));
  }, [user, params.id]);

  if (cargando || !user) {
    return (
      <main className="min-h-screen bg-paper-texture">
        <Header />
        <p className="text-center text-sm text-charcoal/50 py-24">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-2xl px-5 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-semibold">
            Mensajes con el vendedor
          </h1>
          <Link href="/mis-compras" className="text-sm text-ink underline">
            ← Volver a mis compras
          </Link>
        </div>

        {cargandoPedido ? (
          <p className="text-sm text-charcoal/50">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-clay">{error}</p>
        ) : pedido ? (
          <ChatPedido ordenId={pedido.id} usuarioId={user.uid} miRol="comprador" />
        ) : null}
      </section>
    </main>
  );
}
