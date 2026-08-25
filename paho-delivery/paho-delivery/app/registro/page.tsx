import Link from "next/link";
import Header from "@/components/Header";

export default function RegistroPage() {
  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-3xl font-semibold mb-2 text-center">
          Creá tu cuenta en PAHÓ
        </h1>
        <p className="text-center text-charcoal/60 text-sm mb-10">
          ¿Cómo querés usar PAHÓ?
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/registro/comprador"
            className="ficha bg-white border border-line hover:border-ink/40 transition-colors p-8 text-center"
          >
            <span className="stamp w-12 h-12 mx-auto mb-4 text-lg text-ink border-ink">
              🛍
            </span>
            <h2 className="font-display text-xl font-semibold mb-2">
              Quiero comprar
            </h2>
            <p className="text-sm text-charcoal/60">
              Creá tu cuenta de comprador y empezá a elegir productos.
            </p>
          </Link>

          <Link
            href="/registro/vendedor"
            className="ficha bg-white border border-line hover:border-ink/40 transition-colors p-8 text-center"
          >
            <span className="stamp w-12 h-12 mx-auto mb-4 text-lg text-amber-dark border-amber-dark">
              🏪
            </span>
            <h2 className="font-display text-xl font-semibold mb-2">
              Quiero vender
            </h2>
            <p className="text-sm text-charcoal/60">
              Registrá tu empresa, cargá tus datos de facturación y publicá.
            </p>
          </Link>
        </div>

        <p className="text-center text-sm text-charcoal/60 mt-10">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-ink font-medium underline">
            Iniciá sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
