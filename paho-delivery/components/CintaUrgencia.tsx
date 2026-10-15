const mensajes = [
  "Se vende y no vuelve",
  "Hasta 70% menos",
  "Cada unidad con su condición declarada",
  "Pagá con Mercado Pago",
  "Envío o retiro dentro de AMBA",
  "Pocas unidades, sin reposición",
];

/** Cinta que corre sin parar debajo de la portada. Solo mensajes ciertos. */
export default function CintaUrgencia() {
  const fila = [...mensajes, ...mensajes];
  return (
    <div className="ticker overflow-hidden bg-clay text-white" aria-hidden="true">
      <div className="ticker-track py-2.5">
        {[0, 1].map((copia) => (
          <div key={copia} className="flex shrink-0">
            {fila.map((m, i) => (
              <span
                key={`${copia}-${i}`}
                className="px-6 font-mono text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
              >
                {m} <span className="text-white/50 pl-6">●</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
