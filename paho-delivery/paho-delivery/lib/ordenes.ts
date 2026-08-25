export type ItemOrden = {
  id: string;
  titulo: string;
  precio: number;
  cantidad: number;
};

/**
 * Esto es TODO lo que el vendedor puede ver del comprador. A propósito no
 * incluye email, ni ningún otro dato de contacto de la cuenta — el
 * documento de la orden en Firestore nunca contiene esos campos, así que
 * no hay forma de que el vendedor los lea, aunque tenga permiso de leer
 * la orden completa (ver firestore.rules).
 *
 * El teléfono acá adentro NO es el de la cuenta del comprador — es el que
 * el comprador cargó puntualmente como contacto para coordinar ESTE
 * envío, y solo existe si eligió "envío a domicilio".
 */
export type FacturacionComprador = {
  nombre: string;
  tipoDocumento: "DNI" | "CUIT";
  numeroDocumento: string;
  condicionIVA: string;
};

// Fase 1: solo se despacha dentro del AMBA (CABA + Gran Buenos Aires).
// Por eso "provincia" no es texto libre — es un selector con estas dos
// únicas opciones, validado también server-side en el checkout.
export type ZonaEnvio = "CABA" | "GBA";

export type DireccionEnvio = {
  calle: string;
  numero: string;
  depto: string;
  ciudad: string; // barrio (si CABA) o partido (si GBA)
  zona: ZonaEnvio;
  codigoPostal: string;
};

/**
 * Dirección EXACTA del local del vendedor para retiro. Se copia desde el
 * perfil privado del vendedor (vendedores/{uid}.direccionRetiro) recién
 * cuando un comprador inicia el pago de un pedido con método "retiro" —
 * antes de eso, nadie navegando el catálogo la ve, solo el barrio
 * general (ver Envio en lib/firestore.ts). Como queda dentro de una
 * orden puntual, solo la lee el comprador de esa orden y el propio
 * vendedor (ver firestore.rules).
 */
export type DireccionRetiroExacta = {
  calle: string;
  numero: string;
  barrio: string;
  zona: ZonaEnvio;
  codigoPostal: string;
};

export type Envio = {
  metodo: "retiro" | "domicilio";
  costo: number;
  direccion: DireccionEnvio | null;
  telefonoContacto: string | null;
  direccionRetiro: DireccionRetiroExacta | null;
};

export type EstadoEntrega = "pendiente" | "entregado";

export type Orden = {
  compradorId: string;
  vendedorId: string;
  items: ItemOrden[];
  total: number;
  facturacion: FacturacionComprador;
  envio: Envio;
  estado: "pendiente_pago" | "pagado" | "cancelado";
  /**
   * Estilo Mercado Libre: la entrega no se asume sola, el vendedor la
   * confirma a mano tocando "Marcar como entregado" (sirve tanto para
   * retiro en persona como para envío ya despachado/recibido). Es un
   * campo separado de `estado` (que es sobre el pago) a propósito — se
   * puede confirmar entrega independientemente de si ya hay webhook de
   * pago o no.
   */
  entrega: EstadoEntrega;
  entregaConfirmadaEn: unknown;
  mpPreferenceId: string | null;
  creadoEn: unknown;
};
