import { Tag, CreditCard, Truck } from "lucide-react";

const pasos = [
  {
    numero: "1",
    icono: Tag,
    color: "#3C7A5E",
    titulo: "Elegís tu producto",
    texto: "Devoluciones y liquidaciones reales, con su condición declarada y el % de descuento a la vista.",
  },
  {
    numero: "2",
    icono: CreditCard,
    color: "#E8A33D",
    titulo: "Pagás seguro",
    texto: "Con Mercado Pago: tarjeta, efectivo o el medio que ya uses todos los días.",
  },
  {
    numero: "3",
    icono: Truck,
    color: "#D65F4C",
    titulo: "Lo recibís o lo retirás",
    texto: "El vendedor te lo envía a domicilio o coordinás el retiro, dentro de AMBA.",
  },
];

export default function ComoFunciona() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 mt-10 max-w-3xl mx-auto">
      {pasos.map((paso) => {
        const Icono = paso.icono;
        return (
          <div key={paso.numero} className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div
                className="w-16 h-16 rounded-full bg-white border-2 flex items-center justify-center"
                style={{ borderColor: paso.color }}
              >
                <Icono size={26} color={paso.color} />
              </div>
              <span
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full text-white text-[11px] font-mono font-bold flex items-center justify-center border-2 border-paper"
                style={{ backgroundColor: paso.color, transform: "rotate(-8deg)" }}
              >
                {paso.numero}
              </span>
            </div>
            <p className="font-display font-semibold text-sm text-ink mb-1">
              {paso.titulo}
            </p>
            <p className="text-xs text-charcoal/60 leading-relaxed max-w-[200px]">
              {paso.texto}
            </p>
          </div>
        );
      })}
    </div>
  );
}
