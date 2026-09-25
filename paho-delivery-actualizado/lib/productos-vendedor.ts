"use client";

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { comprimirImagenABase64 } from "@/lib/image-utils";
import type { CondicionProducto, Producto, Envio } from "@/lib/firestore";

// Paleta de acento para la ficha cuando todavía no hay foto real, o como
// respaldo si la subida de imagen falla — así el catálogo nunca queda
// con una ficha rota.
const COLORES_ACENTO = [
  "#C7821F",
  "#8C3A4A",
  "#3C7A5E",
  "#1B2A3D",
  "#D65F4C",
  "#2C4258",
];

function colorAlAzar() {
  return COLORES_ACENTO[Math.floor(Math.random() * COLORES_ACENTO.length)];
}

export type NuevoProducto = {
  titulo: string;
  categoria: string;
  categoriaLabel: string;
  condicion: CondicionProducto;
  detalleCondicion: string;
  precio: number;
  precioOriginal: number | null;
  stock: number;
  vendedorId: string;
  vendedor: string;
  imagen: File | null;
  envio: Envio;
};

export async function crearProducto(datos: NuevoProducto): Promise<string> {
  let imagenes: string[] = [];

  if (datos.imagen) {
    // Guardamos la foto comprimida directo en Firestore (ver
    // lib/image-utils.ts) en vez de subirla a Firebase Storage, que
    // ahora exige plan Blaze (pago por uso) para crear un bucket nuevo.
    const dataUrl = await comprimirImagenABase64(datos.imagen);
    imagenes = [dataUrl];
  }

  const docRef = await addDoc(collection(db, "productos"), {
    titulo: datos.titulo,
    categoria: datos.categoria,
    categoriaLabel: datos.categoriaLabel,
    condicion: datos.condicion,
    detalleCondicion: datos.detalleCondicion,
    precio: datos.precio,
    precioOriginal: datos.precioOriginal,
    stock: datos.stock,
    vendedorId: datos.vendedorId,
    vendedor: datos.vendedor,
    imagenColor: colorAlAzar(),
    imagenes,
    activo: true,
    envio: datos.envio,
    creadoEn: serverTimestamp(),
  });

  return docRef.id;
}

export async function getProductosDeVendedor(
  vendedorId: string
): Promise<Producto[]> {
  const ref = collection(db, "productos");
  const q = query(
    ref,
    where("vendedorId", "==", vendedorId),
    orderBy("creadoEn", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
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
  });
}

/** Convierte un File a base64 puro (sin el prefijo data:...;base64,) para mandarlo a la API de generación. */
export function fileABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultado = reader.result as string;
      resolve(resultado.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
