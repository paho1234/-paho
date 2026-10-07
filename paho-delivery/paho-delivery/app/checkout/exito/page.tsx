import Link from "next/link";
import Header from "@/components/Header";

export default function ExitoPage() {
  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-lg px-5 py-24 text-center">
        <span className="stamp w-16 h-16 mx-auto mb-6 text-2xl text-moss border-moss">
          ✓
        </span>
        <h1 className="font-display text-3xl font-semibold mb-3">
          ¡Pago aprobado!
        </h1>
        <p className="text-charcoal/70 mb-8">
          Tu pedido fue confirmado. En breve el vendedor se pondrá en
          contacto para coordinar la entrega.
        </p>
        <Link
          href="/"
          className="inline-block bg-ink text-paper px-6 py-3 rounded-stamp font-medium text-sm"
        >
          Seguir comprando
        </Link>
      </section>
    </main>
  );
}
