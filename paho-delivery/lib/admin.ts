import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Producto } from "@/lib/firestore";
import type { Envio, ItemOrden, EstadoEntrega } from "@/lib/ordenes";

function docToProductoAdmin(id: string, data: DocumentData): Producto {
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
    envio: data.envio ?? {
      retiro: true,
      envioDomicilio: false,
      costoEnvio: null,
      barrioRetiro: null,
    },
  };
}

/**
 * Trae TODOS los productos, de TODOS los vendedores, activos o no — a
 * diferencia de getProductos() en lib/firestore.ts, que solo trae los
 * activos (para el catálogo público). Solo debe usarse en /admin; el
 * permiso real de lectura ya es público a nivel de reglas de Firestore
 * (igual que el catálogo), pero esta vista es exclusiva del panel admin.
 */
export async function getTodosLosProductosAdmin(): Promise<Producto[]> {
  const ref = collection(db, "productos");
  const snap = await getDocs(query(ref, orderBy("creadoEn", "desc")));
  return snap.docs.map((d) => docToProductoAdmin(d.id, d.data()));
}

/**
 * Borra un producto sin importar quién sea su vendedor. Las reglas de
 * Firestore (ver firestore.rules) son las que realmente autorizan esto
 * — solo lo permiten si quien llama tiene `esAdmin: true` en su perfil.
 * Esta función no revisa el rol por su cuenta: si el usuario no es
 * admin, Firestore va a rechazar el borrado igual.
 */
export async function borrarProductoAdmin(productoId: string): Promise<void> {
  await deleteDoc(doc(db, "productos", productoId));
}

// --- Ventas (órdenes) de todos los vendedores ---

export type VentaAdmin = {
  id: string;
  compradorId: string;
  vendedorId: string;
  compradorNombre: string;
  items: ItemOrden[];
  total: number;
  envio: Envio;
  estado: "pendiente_pago" | "pagado" | "cancelado";
  entrega: EstadoEntrega;
  creadoEn: Date | null;
};

function docToVentaAdmin(id: string, data: DocumentData): VentaAdmin {
  return {
    id,
    compradorId: data.compradorId,
    vendedorId: data.vendedorId,
    compradorNombre: data.facturacion?.nombre ?? "(sin nombre)",
    items: data.items ?? [],
    total: data.total ?? 0,
    envio: data.envio ?? {
      metodo: "retiro",
      costo: 0,
      direccion: null,
      telefonoContacto: null,
      direccionRetiro: null,
    },
    estado: data.estado,
    entrega: data.entrega ?? "pendiente",
    creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : null,
  };
}

/**
 * Trae TODAS las órdenes, de TODOS los vendedores — a diferencia de
 * getPedidosDeVendedor() en lib/pedidos-vendedor.ts, que solo trae las
 * de un vendedor puntual. Solo debe usarse en /admin. No requiere un
 * índice compuesto nuevo: no hay `where`, solo un orden simple por
 * fecha, que Firestore indexa automáticamente.
 */
export async function getTodasLasVentasAdmin(): Promise<VentaAdmin[]> {
  const ref = collection(db, "ordenes");
  const snap = await getDocs(query(ref, orderBy("creadoEn", "desc")));
  return snap.docs.map((d) => docToVentaAdmin(d.id, d.data()));
}

// --- Perfiles de vendedores ---

export type VendedorAdmin = {
  id: string;
  nombreEmpresa: string;
  razonSocial: string;
  cuit: string;
  email: string;
  verificado: boolean;
};

function docToVendedorAdmin(id: string, data: DocumentData): VendedorAdmin {
  return {
    id,
    nombreEmpresa: data.nombreEmpresa ?? "(sin nombre)",
    razonSocial: data.razonSocial ?? "",
    cuit: data.cuit ?? "",
    email: data.email ?? "",
    verificado: data.verificado ?? false,
  };
}

export async function getTodosLosVendedoresAdmin(): Promise<VendedorAdmin[]> {
  const snap = await getDocs(collection(db, "vendedores"));
  return snap.docs.map((d) => docToVendedorAdmin(d.id, d.data()));
}

/**
 * Borra el PERFIL del vendedor (documento vendedores/{id}: datos
 * fiscales, dirección de retiro, etc.). No borra su cuenta de acceso
 * (Firebase Auth) ni sus publicaciones — eso se hace aparte, con
 * borrarProductoAdmin() para cada producto. Sin este perfil, el
 * vendedor deja de poder operar (publicar, cobrar) hasta que se
 * registre de nuevo — funciona como una baja/moderación.
 */
export async function borrarVendedorAdmin(vendedorId: string): Promise<void> {
  await deleteDoc(doc(db, "vendedores", vendedorId));
}
