"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import ChatPedido from "@/components/ChatPedido";
import { useAuth } from "@/contexts/AuthProvider";
import { getPedido, type PedidoVendedor } from "@/lib/pedidos-vendedor";

export default function MensajesVendedorPage() {
  const { user, rol, cargando } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<PedidoVendedor | null>(null);
  const [cargandoPedido, setCargandoPedido] = useState(true);
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
    getPedido(params.id)
      .then((p) => {
        if (!p || p.vendedorId !== user.uid) {
          setError("No encontramos ese pedido.");
          return;
        }
        setPedido(p);
      })
      .catch(() => setError("No pudimos cargar el pedido."))
      .finally(() => setCargandoPedido(false));
  }, [user, rol, params.id]);

  if (cargando || !user || rol !== "vendedor") {
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
            Mensajes con el comprador
          </h1>
          <Link href="/vendedor/pedidos" className="text-sm text-ink underline">
            ← Volver a mis pedidos
          </Link>
        </div>

        {cargandoPedido ? (
          <p className="text-sm text-charcoal/50">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-clay">{error}</p>
        ) : pedido ? (
          <ChatPedido ordenId={pedido.id} usuarioId={user.uid} miRol="vendedor" />
        ) : null}
      </section>
    </main>
  );
}
