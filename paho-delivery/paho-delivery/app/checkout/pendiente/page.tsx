import Link from "next/link";
import Header from "@/components/Header";

export default function PendientePage() {
  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-lg px-5 py-24 text-center">
        <span className="stamp w-16 h-16 mx-auto mb-6 text-2xl text-amber-dark border-amber-dark">
          …
        </span>
        <h1 className="font-display text-3xl font-semibold mb-3">
          Pago en proceso
        </h1>
        <p className="text-charcoal/70 mb-8">
          Estamos esperando la confirmación de Mercado Pago. Te avisamos por
          mail apenas se acredite.
        </p>
        <Link
          href="/"
          className="inline-block bg-ink text-paper px-6 py-3 rounded-stamp font-medium text-sm"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
