import Link from "next/link";
import Header from "@/components/Header";

export default function ErrorPage() {
  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-lg px-5 py-24 text-center">
        <span className="stamp w-16 h-16 mx-auto mb-6 text-2xl text-clay border-clay">
          ✕
        </span>
        <h1 className="font-display text-3xl font-semibold mb-3">
          El pago no se pudo procesar
        </h1>
        <p className="text-charcoal/70 mb-8">
          Revisá los datos de tu medio de pago o probá con otro. Tu carrito
          sigue guardado.
        </p>
        <Link
          href="/carrito"
          className="inline-block bg-ink text-paper px-6 py-3 rounded-stamp font-medium text-sm"
        >
          Volver al carrito
        </Link>
      </section>
    </main>
  );
}
