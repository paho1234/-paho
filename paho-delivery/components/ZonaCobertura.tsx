const partidosGBA = [
  { nombre: "Vicente López", x: 335, y: 55, anchor: "start" as const },
  { nombre: "San Isidro", x: 355, y: 38, anchor: "start" as const },
  { nombre: "Tigre", x: 375, y: 20, anchor: "start" as const },
  { nombre: "Morón", x: 220, y: 95, anchor: "end" as const },
  { nombre: "La Matanza", x: 185, y: 130, anchor: "end" as const },
  { nombre: "Lomas de Zamora", x: 270, y: 165, anchor: "start" as const },
  { nombre: "Quilmes", x: 315, y: 180, anchor: "start" as const },
  { nombre: "Avellaneda", x: 345, y: 148, anchor: "start" as const },
];

export default function ZonaCobertura() {
  return (
    <div className="bg-ink/[0.03] border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-charcoal/80">
            <span className="font-semibold">
              Por ahora entregamos solo en AMBA
            </span>{" "}
            (CABA y Gran Buenos Aires), vía Mercado Envíos Flex.
          </p>
          <p className="text-xs text-charcoal/50 mt-0.5">
            Vamos a sumar más zonas del país más adelante.
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-center">
          <svg
            width="280"
            height="200"
            viewBox="0 0 400 210"
            className="text-charcoal/70"
          >
            {/* Mapa ilustrativo, no geográficamente exacto — solo
                transmite "CABA en el centro, GBA alrededor". */}
            <circle
              cx="260"
              cy="100"
              r="52"
              fill="#1B2A3D"
              fillOpacity="0.12"
              stroke="#1B2A3D"
              strokeWidth="1"
            />
            <text
              x="260"
              y="97"
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill="#1B2A3D"
            >
              CABA
            </text>
            <text
              x="260"
              y="113"
              textAnchor="middle"
              fontSize="8.5"
              fill="#1B2A3D"
              fillOpacity="0.6"
            >
              cobertura completa
            </text>

            {partidosGBA.map((p) => (
              <g key={p.nombre}>
                <line
                  x1="260"
                  y1="100"
                  x2={p.x}
                  y2={p.y}
                  stroke="#C7821F"
                  strokeWidth="0.75"
                  strokeDasharray="2 2"
                  opacity="0.45"
                />
                <circle cx={p.x} cy={p.y} r="3.5" fill="#E8A33D" />
                <text
                  x={p.anchor === "end" ? p.x - 7 : p.x + 7}
                  y={p.y + 3}
                  textAnchor={p.anchor}
                  fontSize="9"
                  fill="#1B2A3D"
                  fillOpacity="0.75"
                >
                  {p.nombre}
                </text>
              </g>
            ))}

            <text
              x="200"
              y="203"
              textAnchor="middle"
              fontSize="7.5"
              fill="#1B2A3D"
              fillOpacity="0.4"
            >
              Mapa ilustrativo — no representa límites exactos de cobertura
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
