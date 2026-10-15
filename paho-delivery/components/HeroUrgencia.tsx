import { Zap } from "lucide-react";

type Props = {
  publicaciones: number;
  nuevas48h: number;
};

/**
 * Portada del home. La urgencia sale de datos reales del catálogo
 * (cuántas publicaciones y novedades hay en este momento) —
 * no hay contadores falsos ni "quedan 2" inventados: el cartel solo es
 * creíble si es verdad, y en un outlet de devoluciones lo es: cada
 * producto es una cantidad chica y cuando se vende no se repone.
 */
export default function HeroUrgencia({ publicaciones, nuevas48h }: Props) {
  const stats = [
    { valor: publicaciones, label: "ofertas hoy" },
    ...(nuevas48h > 0 ? [{ valor: nuevas48h, label: "llegaron en 48 hs" }] : []),
  ];

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #7a0f0f 0%, #2a0606 45%, #060201 80%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 bg-clay text-white text-[11px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          <Zap size={12} fill="currentColor" />
          Outlet de devoluciones
        </span>

        <h1 className="mt-5 font-display font-semibold text-4xl md:text-6xl leading-[1.05] text-balance">
          Entra y sale
          <br />
          <span className="text-clay">al toque.</span>
        </h1>

        <p className="mt-4 max-w-xl text-white/75 text-base md:text-lg">
          Devoluciones y liquidaciones de marcas reales, hasta 70% menos.
          Son pocas unidades de cada una y no se reponen:{" "}
          <strong className="text-white">lo que ves hoy, mañana puede no estar.</strong>
        </p>

        <a
          href="#catalogo"
          className="mt-7 inline-flex items-center gap-2 bg-clay hover:bg-white hover:text-clay text-white font-bold text-base px-8 py-3.5 rounded-stamp transition-colors shadow-[0_6px_24px_rgba(227,58,46,0.45)]"
        >
          Ver lo que hay ahora
        </a>

        <dl className="mt-9 flex flex-wrap justify-center gap-x-10 gap-y-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-3xl md:text-4xl font-semibold leading-none">
                {s.valor}
              </dd>
              <p className="mt-1 text-[11px] font-mono uppercase tracking-wide text-white/60">
                {s.label}
              </p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
