// Carga datos iniciales en Firestore usando el Admin SDK.
//
// Uso:
//   1. Firebase Console > Configuración del proyecto > Cuentas de servicio
//      > Generar nueva clave privada. Guardar el JSON como
//      `service-account.json` en la raíz del proyecto (NUNCA commitear).
//   2. node scripts/seed.mjs
//
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, "..", "service-account.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
} catch {
  console.error(
    "No encontré service-account.json en la raíz del proyecto.\n" +
      "Descargalo desde Firebase Console > Configuración del proyecto > " +
      "Cuentas de servicio > Generar nueva clave privada."
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Taxonomía estilo Mercado Libre Argentina, recortada a categorías de
// productos físicos (se excluyen Inmuebles, Servicios, Empleos, Boletas
// de espectáculos, etc. — no aplican a un outlet de devoluciones).
const categorias = [
  { id: "accesorios-vehiculos", label: "Accesorios para Vehículos", orden: 1 },
  { id: "alimentos-bebidas", label: "Alimentos y Bebidas", orden: 2 },
  { id: "mascotas", label: "Animales y Mascotas", orden: 3 },
  { id: "arte-libreria-merceria", label: "Arte, Librería y Mercería", orden: 4 },
  { id: "bebes", label: "Bebés", orden: 5 },
  { id: "belleza-cuidado-personal", label: "Belleza y Cuidado Personal", orden: 6 },
  { id: "camaras-accesorios", label: "Cámaras y Accesorios", orden: 7 },
  { id: "celulares-telefonos", label: "Celulares y Teléfonos", orden: 8 },
  { id: "computacion", label: "Computación", orden: 9 },
  { id: "consolas-videojuegos", label: "Consolas y Videojuegos", orden: 10 },
  { id: "construccion", label: "Construcción", orden: 11 },
  { id: "deportes-fitness", label: "Deportes y Fitness", orden: 12 },
  { id: "electrodomesticos", label: "Electrodomésticos", orden: 13 },
  { id: "electronica-audio-video", label: "Electrónica, Audio y Video", orden: 14 },
  { id: "herramientas", label: "Herramientas", orden: 15 },
  { id: "hogar-muebles-jardin", label: "Hogar, Muebles y Jardín", orden: 16 },
  { id: "instrumentos-musicales", label: "Instrumentos Musicales", orden: 17 },
  { id: "joyas-relojes", label: "Joyas y Relojes", orden: 18 },
  { id: "juegos-juguetes", label: "Juegos y Juguetes", orden: 19 },
  { id: "libros-revistas-comics", label: "Libros, Revistas y Comics", orden: 20 },
  { id: "musica-peliculas-series", label: "Música, Películas y Series", orden: 21 },
  { id: "ropa-accesorios", label: "Ropa y Accesorios", orden: 22 },
  { id: "salud-equipamiento-medico", label: "Salud y Equipamiento Médico", orden: 23 },
];

// Ejemplos de lotes de devolución de distintos vendedores, remapeados a
// la nueva taxonomía.
const productos = [
  {
    titulo: "Juego de sábanas percal 400 hilos, 2 plazas",
    precio: 19999,
    precioOriginal: 34999,
    categoria: "hogar-muebles-jardin",
    categoriaLabel: "Hogar, Muebles y Jardín",
    vendedor: "Patagonia Home",
    vendedorId: "patagonia-home",
    stock: 6,
    condicion: "caja_abierta",
    detalleCondicion:
      "Se abrió la caja para control de calidad. Nunca usado, embalaje secundario intacto.",
    imagenColor: "#C7821F",
    imagenes: [],
    activo: true,
    envio: { retiro: true, envioDomicilio: true, costoEnvio: 3500, barrioRetiro: "Chacarita, CABA" },
  },
  {
    titulo: "Calza deportiva compresión alta cintura",
    precio: 12900,
    precioOriginal: 22500,
    categoria: "ropa-accesorios",
    categoriaLabel: "Ropa y Accesorios",
    vendedor: "CHALLENGE Activewear",
    vendedorId: "challenge",
    stock: 14,
    condicion: "devolucion_sin_uso",
    detalleCondicion:
      "El comprador pidió el talle equivocado. Etiquetas originales puestas.",
    imagenColor: "#8C3A4A",
    imagenes: [],
    activo: true,
    envio: { retiro: true, envioDomicilio: true, costoEnvio: 0, barrioRetiro: "Villa Crespo, CABA" },
  },
  {
    titulo: "Filtro de aceite compatible VW / Ford (lote x10)",
    precio: 39900,
    precioOriginal: 59000,
    categoria: "accesorios-vehiculos",
    categoriaLabel: "Accesorios para Vehículos",
    vendedor: "Repuestos del Sur",
    vendedorId: "repuestos-del-sur",
    stock: 4,
    condicion: "devolucion_sin_uso",
    detalleCondicion: "Excedente de stock de un pedido cancelado. Sin abrir.",
    imagenColor: "#3C7A5E",
    imagenes: [],
    activo: true,
    envio: { retiro: true, envioDomicilio: false, costoEnvio: null, barrioRetiro: "San Martín, GBA" },
  },
  {
    titulo: "Pava eléctrica acero inoxidable 1.7L",
    precio: 24900,
    precioOriginal: 41200,
    categoria: "electrodomesticos",
    categoriaLabel: "Electrodomésticos",
    vendedor: "Hodaia Hogar",
    vendedorId: "hodaia-hogar",
    stock: 3,
    condicion: "reacondicionado",
    detalleCondicion:
      "Tenía una falla en el apagado automático. Se reparó y se probó su funcionamiento.",
    imagenColor: "#1B2A3D",
    imagenes: [],
    activo: true,
    envio: { retiro: false, envioDomicilio: true, costoEnvio: 4200, barrioRetiro: null },
  },
  {
    titulo: "Mochila running 15L con porta caramañola",
    precio: 15800,
    precioOriginal: 27800,
    categoria: "deportes-fitness",
    categoriaLabel: "Deportes y Fitness",
    vendedor: "Andes Trail",
    vendedorId: "andes-trail",
    stock: 9,
    condicion: "detalle_estetico",
    detalleCondicion:
      "Costura visible en el bolsillo frontal. No afecta el uso ni la resistencia.",
    imagenColor: "#D65F4C",
    imagenes: [],
    activo: true,
    envio: { retiro: true, envioDomicilio: true, costoEnvio: 5000, barrioRetiro: "Núñez, CABA" },
  },
  {
    titulo: "Manta polar plaza y media, gris melange",
    precio: 9990,
    precioOriginal: 18990,
    categoria: "hogar-muebles-jardin",
    categoriaLabel: "Hogar, Muebles y Jardín",
    vendedor: "Patagonia Home",
    vendedorId: "patagonia-home",
    stock: 11,
    condicion: "devolucion_sin_uso",
    detalleCondicion: "Devolución por cambio de opinión. Nunca usada.",
    imagenColor: "#C7821F",
    imagenes: [],
    activo: true,
    envio: { retiro: true, envioDomicilio: true, costoEnvio: 3500, barrioRetiro: "Chacarita, CABA" },
  },
  {
    titulo: "Zapatillas urbanas running, talle 42",
    precio: 22000,
    precioOriginal: 48000,
    categoria: "deportes-fitness",
    categoriaLabel: "Deportes y Fitness",
    vendedor: "Liquidación Norte",
    vendedorId: "liquidacion-norte",
    stock: 2,
    condicion: "caja_abierta",
    detalleCondicion:
      "Caja abierta para foto de catálogo. Zapatillas sin uso.",
    imagenColor: "#2C4258",
    imagenes: [],
    activo: true,
    envio: { retiro: false, envioDomicilio: true, costoEnvio: 6000, barrioRetiro: null },
  },
  {
    titulo: "Licuadora de vaso 1.5L, 600W",
    precio: 18500,
    precioOriginal: 33900,
    categoria: "electrodomesticos",
    categoriaLabel: "Electrodomésticos",
    vendedor: "Liquidación Norte",
    vendedorId: "liquidacion-norte",
    stock: 5,
    condicion: "reacondicionado",
    detalleCondicion:
      "Se reemplazó la cuchilla y se testeó en los 3 niveles de velocidad.",
    imagenColor: "#8C3A4A",
    imagenes: [],
    activo: true,
    envio: { retiro: true, envioDomicilio: true, costoEnvio: 6000, barrioRetiro: "San Isidro, GBA" },
  },
];

async function seed() {
  console.log("Cargando categorías…");
  for (const { id, ...data } of categorias) {
    await db.collection("categorias").doc(id).set(data);
  }

  console.log("Cargando productos…");
  for (const producto of productos) {
    await db.collection("productos").add({
      ...producto,
      creadoEn: FieldValue.serverTimestamp(),
    });
  }

  console.log(
    `Listo: ${categorias.length} categorías y ${productos.length} productos cargados.`
  );
}

seed().catch((err) => {
  console.error("Error cargando datos:", err);
  process.exit(1);
});
