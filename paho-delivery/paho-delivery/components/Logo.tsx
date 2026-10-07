/**
 * Logo de "Todo Regalado", armado en código (no es un archivo de
 * imagen) — un sello de etiqueta de regalo rotado, en el mismo lenguaje
 * visual que ya usa el resto del sitio (Fraunces itálica para el
 * nombre, el mismo giro de -8° que los demás sellos/stamps).
 *
 * Si en algún momento se diseña un logo definitivo como imagen, alcanza
 * con reemplazar el uso de <LogoHeader /> / <LogoHero /> por un <img>
 * apuntando al archivo nuevo en /public — no hace falta tocar nada más.
 */

function EtiquetaRegalo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <g transform="rotate(-10 20 20)">
        <rect
          x="6"
          y="12"
          width="28"
          height="18"
          rx="3"
          fill="#E8A33D"
          stroke="#1B2A3D"
          strokeWidth="1.5"
        />
        <circle cx="13" cy="21" r="2.5" fill="#FAF6EF" stroke="#1B2A3D" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

export function LogoHeader() {
  return (
    <span className="inline-flex items-center gap-2">
      <EtiquetaRegalo size={26} />
      <span className="font-display font-semibold text-xl leading-none text-ink">
        Todo Regalado
      </span>
    </span>
  );
}

export function LogoHero() {
  return (
    <span className="inline-flex flex-col items-center gap-2">
      <EtiquetaRegalo size={52} />
      <span className="font-display font-semibold text-4xl md:text-5xl leading-none text-ink text-center">
        Todo Regalado
      </span>
    </span>
  );
}
