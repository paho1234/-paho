"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage, db } from "@/lib/firebase";

export type Rol = "comprador" | "vendedor" | "admin";

export type CondicionIVA =
  | "responsable_inscripto"
  | "monotributista"
  | "exento"
  | "consumidor_final";

export type TipoDocumento = "DNI" | "CUIT";

export type DatosComprador = {
  nombre: string;
  email: string;
  password: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
};

export type ZonaAMBA = "CABA" | "GBA";

export type DireccionRetiro = {
  calle: string;
  numero: string;
  barrio: string; // esto es lo único que se muestra en público, en cada producto
  zona: ZonaAMBA;
  codigoPostal: string;
};

export type DatosVendedor = {
  nombreEmpresa: string;
  razonSocial: string;
  cuit: string;
  condicionIVA: CondicionIVA;
  email: string;
  password: string;
  documentoFacturacion?: File | null;
  aceptaDeclaracionCondicion: boolean;
  /**
   * Retiro y envío son AMBOS obligatorios para todo vendedor — no hay
   * checkbox de "voy a ofrecer retiro". Todo el que se registra tiene
   * que cargar su dirección de local.
   */
  direccionRetiro: DireccionRetiro;
  /**
   * Tarifa fija de envío a AMBA que se cobra una vez por pedido (no por
   * producto). Obligatoria, igual que el retiro.
   */
  costoEnvioAMBA: number;
};

/** Valida formato de CUIT: XX-XXXXXXXX-X (11 dígitos). No verifica contra AFIP. */
export function validarFormatoCUIT(cuit: string): boolean {
  const limpio = cuit.replace(/[^0-9]/g, "");
  return limpio.length === 11;
}

/** Valida formato de DNI argentino: 7 u 8 dígitos. */
export function validarFormatoDNI(dni: string): boolean {
  const limpio = dni.replace(/[^0-9]/g, "");
  return limpio.length >= 7 && limpio.length <= 8;
}

export function validarDocumento(tipo: TipoDocumento, valor: string): boolean {
  return tipo === "CUIT" ? validarFormatoCUIT(valor) : validarFormatoDNI(valor);
}

export function formatearCUIT(cuit: string): string {
  const limpio = cuit.replace(/[^0-9]/g, "").slice(0, 11);
  if (limpio.length <= 2) return limpio;
  if (limpio.length <= 10) return `${limpio.slice(0, 2)}-${limpio.slice(2)}`;
  return `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}`;
}

export async function registrarComprador(datos: DatosComprador) {
  if (!validarDocumento(datos.tipoDocumento, datos.numeroDocumento)) {
    throw new Error(
      datos.tipoDocumento === "DNI"
        ? "El DNI debe tener 7 u 8 dígitos."
        : "El CUIT debe tener 11 dígitos."
    );
  }

  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(
    auth,
    datos.email,
    datos.password
  );

  await updateProfile(cred.user, { displayName: datos.nombre });

  // Este documento es privado (solo el propio usuario lo puede leer, ver
  // firestore.rules). El número de documento vive acá, NUNCA en el
  // documento de la orden más que como el dato puntual que necesita el
  // vendedor para facturar — ver lib/ordenes.ts.
  await setDoc(doc(db, "usuarios", cred.user.uid), {
    rol: "comprador" satisfies Rol,
    nombre: datos.nombre,
    email: datos.email,
    tipoDocumento: datos.tipoDocumento,
    numeroDocumento: datos.numeroDocumento.replace(/[^0-9]/g, ""),
    creadoEn: serverTimestamp(),
  });

  return cred.user;
}

export async function registrarVendedor(datos: DatosVendedor) {
  if (!validarFormatoCUIT(datos.cuit)) {
    throw new Error("El CUIT ingresado no tiene un formato válido.");
  }

  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(
    auth,
    datos.email,
    datos.password
  );

  await updateProfile(cred.user, { displayName: datos.nombreEmpresa });

  let documentoUrl: string | null = null;
  if (datos.documentoFacturacion) {
    const storage = getFirebaseStorage();
    const path = `vendedores/${cred.user.uid}/documentos/${datos.documentoFacturacion.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, datos.documentoFacturacion);
    documentoUrl = await getDownloadURL(storageRef);
  }

  // Perfil general (mismo shape que usuarios comprador, para queries simples)
  await setDoc(doc(db, "usuarios", cred.user.uid), {
    rol: "vendedor" satisfies Rol,
    nombre: datos.nombreEmpresa,
    email: datos.email,
    creadoEn: serverTimestamp(),
  });

  // Perfil extendido de vendedor, con datos de facturación. La dirección
  // de retiro EXACTA vive acá adentro a propósito — esta colección es
  // privada (ver firestore.rules), solo el propio vendedor la lee. Lo
  // único que se muestra en público es el "barrio" dentro de cada
  // producto (ver lib/productos-vendedor.ts) — nunca la calle/número acá
  // adentro. La dirección completa recién se copia a una orden puntual
  // cuando un comprador inicia el pago con método "retiro" (ver
  // app/api/mercadopago/crear-preferencia/route.ts), así que solo la ve
  // quien ya está comprando, no cualquiera navegando el catálogo.
  await setDoc(doc(db, "vendedores", cred.user.uid), {
    nombreEmpresa: datos.nombreEmpresa,
    razonSocial: datos.razonSocial,
    cuit: formatearCUIT(datos.cuit),
    condicionIVA: datos.condicionIVA,
    email: datos.email,
    documentoFacturacionUrl: documentoUrl,
    verificado: false, // pasa a true cuando alguien de PAHO valide los datos
    aceptaDeclaracionCondicion: datos.aceptaDeclaracionCondicion,
    ofreceRetiro: true,
    direccionRetiro: datos.direccionRetiro,
    costoEnvioAMBA: datos.costoEnvioAMBA,
    mpSellerId: null, // se completa en Fase 2, al conectar OAuth de Mercado Pago
    creadoEn: serverTimestamp(),
  });

  return cred.user;
}

export async function iniciarSesion(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function cerrarSesion() {
  const auth = getFirebaseAuth();
  await signOut(auth);
}
