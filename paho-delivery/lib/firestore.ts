import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// PAHO es un outlet de devoluciones/liquidaciones: el estado real del
// producto es información legal, no un detalle de marketing (Ley de
// Defensa del Consumidor). Por eso reemplaza al viejo "Nuevo" / "Usado".
export type CondicionProducto =
  | "devolucion_sin_uso"
  | "reacondicionado"
  | "detalle_estetico"
  | "caja_abierta";

export const condicionLabel: Record<CondicionProducto, string> = {
  devolucion_sin_uso: "Devolución sin uso",
  reacondicionado: "Reacondicionado",
  detalle_estetico: "Con detalle estético",
  caja_abierta: "Caja abierta",
};

export const condicionDescripcion: Record<CondicionProducto, string> = {
  devolucion_sin_uso:
    "El comprador se arrepintió o se equivocó de talle/modelo. Producto intacto, nunca usado.",
  reacondicionado:
    "Tenía una falla, se reparó y se probó su funcionamiento antes de volver a publicarse.",
  detalle_estetico:
    "Funciona perfecto, pero tiene una marca, rasguño o imperfección visual — por eso el precio.",
  caja_abierta:
    "Se abrió el embalaje original (para control o exhibición) pero el producto no se usó.",
};

export type Envio = {
  retiro: boolean;
  envioDomicilio: boolean;
  /**
   * Tarifa fija de envío del vendedor a AMBA — se cobra UNA VEZ por
   * pedido, no por producto ni por unidad. Si el vendedor tiene varias
   * publicaciones con envío, tiene que cargar el mismo valor en todas
   * (ver el aviso en /vendedor/productos/nuevo). null si no ofrece envío
   * a domicilio (solo retiro).
   */
  costoEnvio: number | null;
  /**
   * Barrio + zona del local de retiro (ej: "Belgrano, CABA") — a
   * propósito NUNCA la dirección exacta. Se toma del perfil privado del
   * vendedor al publicar (ver lib/auth.ts DireccionRetiro), no se le
   * pregunta de nuevo por producto. null si no ofrece retiro.
   */
  barrioRetiro: string | null;
};

export type Producto = {
  id: string;
  titulo: string;
  precio: number;
  precioOriginal: number | null;
  categoria: string;
  categoriaLabel: string;
  vendedor: string;
  vendedorId: string;
  stock: number;
  condicion: CondicionProducto;
  detalleCondicion?: string;
  imagenColor: string;
  imagenes?: string[];
  activo: boolean;
  envio: Envio;
};

export type Categoria = {
  slug: string;
  label: string;
};

function docToProducto(id: string, data: DocumentData) {
  return {
    id,
    titulo: data.titulo,
    precio: data.precio,
    precioOriginal: data.precioOriginal ?? null,
    categoria: data.categoria,
    categoriaLabel: data.categoriaLabel,
    vendedor: data.vendedor,
    vendedorId: data.vendedorId,
    stock: data.stock,
    condicion: data.condicion,
    detalleCondicion: data.detalleCondicion ?? "",
    imagenColor: data.imagenColor ?? "#1B2A3D",
    imagenes: data.imagenes ?? [],
    activo: data.activo ?? true,
    envio: data.envio ?? { retiro: true, envioDomicilio: false, costoEnvio: null, barrioRetiro: null },
  } as Producto;
}

export function descuentoPorcentaje(p: Producto): number | null {
  if (!p.precioOriginal || p.precioOriginal <= p.precio) return null;
  return Math.round((1 - p.precio / p.precioOriginal) * 100);
}

/**
 * Trae todos los productos activos, opcionalmente filtrados por categoría.
 * Requiere un índice compuesto (activo + categoria + fecha) si se agrega
 * orderBy con filtro — Firestore te va a tirar el link para crearlo en la
 * consola la primera vez que corra la query.
 */
export async function getProductos(categoria?: string): Promise<Producto[]> {
  const ref = collection(db, "productos");
  const filtros = [where("activo", "==", true)];
  if (categoria) filtros.push(where("categoria", "==", categoria));

  const q = query(ref, ...filtros, orderBy("creadoEn", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToProducto(d.id, d.data()));
}

export async function getProducto(id: string): Promise<Producto | null> {
  const ref = doc(db, "productos", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return docToProducto(snap.id, snap.data());
}

export async function getCategorias(): Promise<Categoria[]> {
  const ref = collection(db, "categorias");
  const snap = await getDocs(query(ref, orderBy("orden", "asc")));
  return snap.docs.map((d) => ({
    slug: d.id,
    label: d.data().label as string,
  }));
}

export function formatARS(valor: number) {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}
